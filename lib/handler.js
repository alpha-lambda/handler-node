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

	handler.with = extensions => {
		if (!extensions || typeof extensions !== 'object') {
			throw new Error('extensions is not an object');
		}

		return handler.use((event, context, next) => {
			Object.entries(extensions).forEach(([key, value]) => {
				Object.assign(context, {
					[key]: Object.assign({}, value, context[key])
				});
			});

			return next();
		});
	};

	return handler;
};
