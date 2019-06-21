# @alpha-lambda/handler

[![Build Status][ci-image]][ci-url]
[![Coverage Status][coverage-image]][coverage-url]
[![NPM version][npm-image]][npm-url]
[![Dependencies Status][dependencies-image]][dependencies-url]
[![DevDependencies Status][devdependencies-image]][devdependencies-url]

Tiny wrapper that ensures that [AWS Lambda][aws-lambda-url] function's callback is always called. In other words, from your handler you can return value, promise, throw exception, and this library will wrap your code into a promise while calling appropriate lambda-required callback. Your handler is composed of middleware, similar to [Express][express-url] or [Koa][koa-url].

## Installation

```bash
$ npm install @alpha-lambda/handler
```

## Usage

```js
const handler = require('@alpha-lambda/handler');

module.exports.handler = handler()
	.use(async (event, context, next) => {
		// this is some middleware
		// this will forward to next function in the chain
		await next();
		// you can do things, like logging, after the fact
		// you can also override the return value=
	})
	.use((event, context) => {
		return 'Hello, world!';
	});
```

### next()

The `next()` function takes up to three arguments: `(err, context, event)`.

If you specify `err`, then execution is rejected with it. You can also (optionally) specify context/event to override those values for subsequent middleware.

Examples:

```js
next(); // no err, no override for context/event
next(new Error('failure!')); // rejected with Error
next(null, {}); // context is overriden
next(null, null, {}); // event is overriden
next(null, {}, {}); // both context and event are overriden
```

## Middleware

Use these middleware to extend functionality.

| Middleware | Author |
|:-------|:------:|
| **[Bunyan Logger][alpha-lambda-bunyan-url]** <br/> Bunyan logger middleware for alpha-lambda | [Anton Bazhal][anton-bazhal-url] |

## License

The MIT License (MIT)

Copyright (c) 2016-2019 Anton Bazhal

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[anton-bazhal-url]: https://github.com/AntonBazhal
[aws-context-url]: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
[aws-lambda-url]: https://aws.amazon.com/lambda/details/
[bunyan-log-child-url]: https://www.npmjs.com/package/bunyan#logchild
[bunyan-url]: https://www.npmjs.com/package/bunyan
[ci-image]: https://circleci.com/gh/alpha-lambda/handler-node.svg?style=shield&circle-token=67cd5dfa3c7473cc2e7f7deff564cacf93082266
[ci-url]: https://circleci.com/gh/alpha-lambda/handler-node
[coverage-image]: https://coveralls.io/repos/github/alpha-lambda/handler-node/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/alpha-lambda/handler-node?branch=master
[dependencies-url]: https://david-dm.org/alpha-lambda/handler-node
[dependencies-image]: https://david-dm.org/alpha-lambda/handler-node/status.svg
[devdependencies-url]: https://david-dm.org/alpha-lambda/handler-node?type=dev
[devdependencies-image]: https://david-dm.org/alpha-lambda/handler-node/dev-status.svg
[express-url]: https://expressjs.com/
[koa-url]: http://koajs.com/
[alpha-lambda-bunyan-url]: https://www.npmjs.com/package/alpha-lambda-bunyan
[npm-url]: https://www.npmjs.org/package/@alpha-lambda/handler
[npm-image]: https://img.shields.io/npm/v/@alpha-lambda/handler.svg
