'use strict';

async function dispatch(middleware, event, context, i = 0) {
	const fn = middleware[i] || Function.prototype;
	let prevResult;
	const next = async (err, nxtContext, nxtEvent) => {
		if (err) {
			throw err;
		}

		const result = await dispatch(middleware, nxtEvent || event, nxtContext || context, i + 1);

		// Save result if one was passed
		if (result !== undefined) {
			prevResult = result;
		}

		return result;
	};

	const result = await fn(event, context, next);

	// Use result from previous middleware if this one didn't pass back a result
	if (result === undefined) {
		return prevResult;
	}

	return result;
}

module.exports = function () {
	const middleware = [];

	const handler = async (event, context) => {
		return dispatch(middleware, event, context);
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
