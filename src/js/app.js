const Utils = {
  /**
   * Converts a html string to a dom element
   */
  htmlToElement: (html) => {
    html = html.trim();

    let template = document.createElement('template');

    template.innerHTML = html;

    return template.content.firstChild;
  },

  /**
   * Deletes all the childen of an element
   * leaves it alone and empty
   * 
   * @param {HTMLElement} element
   */
  emptyElement: (element) => {
    let children = element.children;
    for (let i = 0; i < children.length; i++) {
      children[i].parentNode.removeChild(children[i]);
    }
  }
}


const App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    /**
     * NOTE:// 
     * Due to some bugs or different reasons metamask eth providers
     * returns null for getCoinbase account,
     * if that problems occurs
     * replace if (typeof web3 !== 'undefined') with if (typeof web3 !== 'undefined' && false)
     * or comment the if section  
     */
    if (typeof web3 !== 'undefined' && false) {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Election.json", (election) => {
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);

      /**
       * Listen for ethereum blockchain voting events
       */
      App.listenForEvents();

      return App.render();
    })
  },

  /**
   * Creats a candidate from array  
   * @param {Array} canArray
   */
  _buildCandidate(canArray) {
    return {
      id: canArray[0],
      name: canArray[1],
      voteCount: canArray[2]
    }
  },

  _handleError(e) {
    console.error(e);

    if (e.message && e.message.indexOf("revert") >= 0) {
      let i = e.message.indexOf("revert") + 7;

      alert(`Error: ${e.message.substring(i, e.message.length)}`);
    }
  },

  castVote: async () => {
    var candiateId = $('#candidatesSelect').val();

    App.renderLoadingState();

    try {

      const election = await App.contracts.Election.deployed();

      await election.vote(candiateId, { from: App.account });

      /**
       * User has successfully casted vote, he can't cast anymore
       */
      $('#form').hide();

      alert("Success: Vote casted Successfully");

      App.render();
    } catch (e) {
      App._handleError(e);
    } finally {
      App.renderLoadedState();
    }
  },

  listenForEvents: async () => {
    const election = await App.contracts.Election.deployed();

    election.votedEvent({}, {
      fromBlock: 0,
      toBlock: 'latest'
    }).watch((err, event) => {
      if (err) { return App._handleError(err); }

      setTimeout(() => {
        console.log(event);
        App.render();
      }, 4000);
    });
  },

  renderLoadingState() {
    $('#content').hide();
    $('#loader').show();
  },

  renderLoadedState() {
    $('#content').show();
    $('#loader').hide();
  },

  render: async () => {
    App.renderLoadingState();

    web3.eth.getAccounts((err, accounts) => {
      if (err === null) {
        App.account = accounts[3];
        $('#accountAddress').html("Your account: " + App.account);
      }
    });

    const election = await App.contracts.Election.deployed();
    let candidatesCount = await election.candidatesCount();
    candidatesCount = candidatesCount.toNumber();

    let candidatesResults = document.querySelector('#candidatesResults');
    let candidatesSelect = document.querySelector('#candidatesSelect');

    let candidates = [];

    try {



      for (let i = 1; i <= candidatesCount; i++) {
        const canArray = await election.candidates(i);
        candidates.push(App._buildCandidate(canArray));
      }

      console.log(candidates.length);

      Utils.emptyElement(candidatesResults);
      Utils.emptyElement(candidatesSelect);

      for (let i = 0; i < candidatesCount; i++) {
        const { id, name, voteCount } = candidates[i];



        /**
         * Render candidate table row
         */
        var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
        let candidateEl = Utils.htmlToElement(candidateTemplate);
        candidatesResults.append(candidateEl);

        console.log("CANDIDATE FOR MLOPP");
        console.log(candidatesResults.children);

        /**
         * render candidate select option
         */
        var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        let candidateOptionEl = Utils.htmlToElement(candidateOption);
        candidatesSelect.append(candidateOptionEl);
      }

      console.log("END");
      console.log(candidatesResults.children.length);

      const hasVoted = await election.voters(App.account);

      /**
       * If the current user has voted, hide the form
       * so that, user is not able to vote again
       */
      if (hasVoted) {
        // $('form').hide();
      }

    } catch (e) {
      App._handleError(e);
    } finally {
      App.renderLoadedState();
    }
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
