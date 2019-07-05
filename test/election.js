const Election = artifacts.require('./Election.sol');

contract('Election', (accounts) => {

    before(async () => {

        this.election = await Election.deployed();

    })

    it('Initis with two candidates', async () => {
        let count = await this.election.candidatesCount();

        assert.equal(count, 2);
    });

    it('allows a voter to cast a vote', async () => {
        candidateId = 1;

        const voted = await this.election.vote(candidateId, { from: accounts[0] });

        assert(voted, "the voter was marked as voted");

        const candidate = await this.election.candidates(candidateId);

        const voteCount = candidate[2];

        assert.equal(voteCount, 1, "increments the candidate's vote count");
    });

    it('denies user to cast another vote', async () => {
        candidateId = 1;

        const voted = await this.election.vote(candidateId, { from: accounts[0] });

        assert(voted, "the voter was mark as voted");

        const candidate = await this.election.candidates(candidateId);

        const voteCount = candidate[2];

        assert.notEqual(voteCount, 2, "should not increment the vote count futher");
    });
});