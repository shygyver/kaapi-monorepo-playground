import { server } from '../src/server';
import { expect } from 'chai';

describe('API Endpoints', () => {
    beforeEach(async () => {
        await server.base().initialize();
    });

    afterEach(async () => {
        await server.stop({
            timeout: 2000,
        });
    });

    it('responds with 200 POST /ark/combination', async () => {
        const res = await server.base().inject({
            method: 'post',
            url: '/ark/combination',
            payload: {
                n: '18',
            },
        });
        expect(res.statusCode).to.equal(200);
        expect(JSON.parse(res.payload)).to.deep.include({ inputs: { n: 18, r: 3 }, coefficient: 816 });
    });

    it('responds with 200 POST /joi/combination', async () => {
        const res = await server.base().inject({
            method: 'post',
            url: '/joi/combination',
            payload: {
                n: 45,
                r: 1,
            },
        });
        expect(res.statusCode).to.equal(200);
        expect(JSON.parse(res.payload)).to.deep.include({ inputs: { n: 45, r: 1 }, coefficient: 45 });
    });

    it('responds with 400 POST /valibot/combination', async () => {
        const res = await server.base().inject({
            method: 'post',
            url: '/valibot/combination',
            payload: {
                n: 45,
                r: 9,
            },
        });
        expect(res.statusCode).to.equal(400);
        expect(JSON.parse(res.payload)).to.deep.include({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid type: Expected (1 | 2 | 3) but received 9 at "payload.r"',
        });
    });

    it('responds with 400 POST /zod/combination', async () => {
        const res = await server.base().inject({
            method: 'post',
            url: '/zod/combination',
            payload: {
                n: 1,
                r: 2,
            },
        });
        expect(res.statusCode).to.equal(400);
        expect(JSON.parse(res.payload)).to.deep.include({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Make sure that n ≥ r at "payload"',
        });
    });
});
