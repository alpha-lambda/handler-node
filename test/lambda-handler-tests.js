'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const lambdaHandler = require('../.');

const noop = () => {};
const testEvent = { answer: 42 };
const testContext = {
	functionName: 'testFunction',
	awsRequestId: '00112233445566778899',
	functionVersion: '$LATEST'
};

describe('handler', function() {

	it('should return a function', function() {
		expect(lambdaHandler()).to.be.a('function');
	});

	it('should have a use() method', function() {
		expect(lambdaHandler())
			.to.have.property('use')
			.that.is.a('function');
	});

	describe('use()', function() {
		it('should throw when middleware is not provided', function() {
			expect(() => lambdaHandler().use()).to.throw(Error, /^middleware is not a function$/);
		});

		it('should throw when midleware is not a function', function() {
			expect(() => lambdaHandler().use(42)).to.throw(Error, /^middleware is not a function$/);
		});

		it('should return the handler', function() {
			const handler = lambdaHandler();
			const result = handler.use(noop);

			expect(result).to.deep.equal(handler);
		});
	});

	describe('handler', function() {
		it('returns a promise', function() {
			const fixture = lambdaHandler().use(noop);
			expect(fixture({}, testContext)).to.be.an.instanceof(Promise);
		});

		it('resolves when plain value is returned', async function() {
			const testResult = true;
			const fixture = lambdaHandler().use(() => testResult);

			const result = await fixture({}, testContext);
			expect(result).to.equal(testResult);
		});

		it('resolves when resolved promise is returned', async function() {
			const testResult = true;
			const fixture = lambdaHandler().use(() => Promise.resolve(testResult));

			const result = await fixture({}, testContext);
			expect(result).to.equal(testResult);
		});

		it('rejects when rejected promise is returned', async function() {
			const testError = new Error('Winter is coming!');
			const fixture = lambdaHandler().use(() => Promise.reject(testError));

			try {
				const result = await fixture({}, testContext);
				expect(result).to.not.exist;
			} catch (err) {
				expect(err).to.deep.equal(testError);
			}
		});

		it('rejects when exception is thrown', async function() {
			const testError = new Error('Winter is coming!');
			const fixture = lambdaHandler().use(() => {
				throw testError;
			});

			try {
				const result = await fixture({}, testContext);
				expect(result).to.not.exist;
			} catch (err) {
				expect(err).to.deep.equal(testError);
			}
		});

		it('provides middleware with event', function() {
			const middleware = sinon.mock()
				.withArgs(testEvent);

			const fixture = lambdaHandler().use(middleware);

			return fixture(testEvent, testContext)
				.then(() => {
					middleware.verify();
				});
		});

		it('provides middleware with context', function() {
			const middleware = sinon.mock()
				.withArgs(sinon.match.any, sinon.match(testContext));

			const fixture = lambdaHandler().use(middleware);

			return fixture(testEvent, testContext)
				.then(() => {
					middleware.verify();
				});
		});

		it('provides middleware with next', function() {
			const middleware = sinon.mock()
				.withArgs(sinon.match.any, sinon.match.any, sinon.match.func);

			const fixture = lambdaHandler().use(middleware);

			return fixture(testEvent, testContext)
				.then(() => {
					middleware.verify();
				});
		});

		it('chains middleware', function() {
			const spy = sinon.spy(function(event, contex, next) {
				return next();
			});
			const mock = sinon.mock()
				.withArgs(sinon.match.any, sinon.match.any, sinon.match.func);

			const fixture = lambdaHandler().use(spy).use(mock);

			return fixture(testEvent, testContext)
				.then(() => {
					expect(spy.calledOnce).to.be.true;
					mock.verify();
				});
		});

		it('lets middleware catch errors', function() {
			const stub = sinon.stub();
			const catcher = (event, contex, next) => {
				return next().catch(stub);
			};
			const thrower = () => {
				throw new Error();
			};

			const fixture = lambdaHandler().use(catcher).use(thrower);

			return fixture(testEvent, testContext)
				.then(() => {
					expect(stub.called).to.be.true;
				});
		});

		it('middleware can cause error via next', async function() {
			const testError = new Error();
			const spy = sinon.spy(function(event, context, next) {
				return next(testError);
			});
			const stub = sinon.stub();

			const fixture = lambdaHandler().use(spy).use(stub);

			try {
				const result = await fixture(testEvent, testContext);
				expect(result).to.not.exist;
			} catch (err) {
				expect(err).to.deep.equal(testError);
			}
		});

	});

	it('middleware can provide a new context via next', function() {
		const newTestContext = Object.assign({ extra: true }, testContext);
		const newContext = (event, context, next) => {
			return next(null, newTestContext);
		};
		const mock = sinon.mock()
			.withArgs(sinon.match.any, sinon.match(newTestContext));

		const fixture = lambdaHandler().use(newContext).use(mock);

		return fixture(testEvent, testContext)
			.then(() => {
				mock.verify();
			});
	});

	it('middleware can call next() beyond the chain', function() {
		const spy = sinon.spy(function(event, context, next) {
			return next();
		});

		const fixture = lambdaHandler().use(spy);

		return fixture(testEvent, testContext)
			.then(() => {
				expect(spy.calledOnce).to.be.true;
			});
	});

	it('middleware provide a new event from next()', function() {
		const spy = sinon.spy();

		const fixture = lambdaHandler()
			.use(function(event, context, next) {
				return next(null, null, 'test');
			})
			.use(spy);

		return fixture(testEvent, testContext)
			.then(() => {
				expect(spy.calledOnce).to.be.true;
				expect(spy.firstCall.args[0]).to.equal('test');
			});
	});

	it('middleware can override result after next()', function() {
		const stub = sinon.stub().returns('foo');
		const fixture = lambdaHandler()
			.use(async (event, context, next) => {
				await next();
				return 'bar';
			})
			.use(stub);

		return fixture(testEvent, testContext)
			.then(result => {
				expect(result).to.equal('bar');
				expect(stub.calledOnce).to.be.true;
			});
	});

	it('can do things around next() without affecting result', function() {
		const obj = {};
		let after = false;
		const fixture = lambdaHandler()
			.use(async (event, context, next) => {
				await next();
				after = true;
			})
			.use(() => obj);

		return fixture(testEvent, testContext)
			.then(result => {
				expect(result).to.equal(obj);
				expect(after).to.equal(true);
			});
	});

	it('has expected execution order', function() {
		const order = [];
		const fixture = lambdaHandler()
			.use(async (event, context, next) => {
				order.push('1-before');
				return next()
					.then(() => {
						order.push('1-after');
					});
			})
			.use(async (event, context, next) => {
				order.push('2-before');
				await next();
				order.push('2-after');
			})
			.use(() => {
				order.push('3');
			});

		return fixture(testEvent, testContext)
			.then(() => {
				expect(order).to.deep.equal(['1-before', '2-before', '3', '2-after', '1-after']);
			});
	});

});
