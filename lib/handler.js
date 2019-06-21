'use strict';

async function dispatch(middleware, state, i = 0) {
	const fn = middleware[i] || Function.prototype;
	const next = (err, context, event) => {
		if (err) {
			return Promise.reject(err);
		}

		if (context !== undefined) {
			state.context = context;
		}

		if (event !== undefined) {
			state.event = event;
		}

		return dispatch(middleware, state, i + 1);
	};

	const result = await fn(state.event, state.context, next);

	if (result !== undefined) {
		state.result = result;
	}

	return state;
}

module.exports = function () {
	const middleware = [];

	const handler = async (event, context) => {
		const { result } = await dispatch(middleware, { event, context });
		return result;
	};

	handler.use = mw => {
		if (typeof mw !== 'function') {
			throw new Error('middleware is not a function');
		}
		middleware.push(mw);
		return handler;
	};

	return handler;
};
