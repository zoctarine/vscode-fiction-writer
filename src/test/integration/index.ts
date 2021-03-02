import * as path from 'path';
import * as jest from 'jest';

export function run(): Promise<void> {
	const testsRoot = path.resolve(__dirname);

	return new Promise((c, e) => {

		jest
		.runCLI({ testMatch: ["<rootDir>/test/integration/**/**.test.js"]} as any, [testsRoot])
		.then(jestCliCallResult => {
		  jestCliCallResult.results.testResults.forEach(testResult => {
			testResult.testResults
			  .filter(assertionResult => assertionResult.status === "passed")
			  .forEach(({ ancestorTitles, title, status }) => {
				console.info(`  ● ${ancestorTitles} › ${title} (${status})`);
			  });
		  });

		  jestCliCallResult.results.testResults.forEach(testResult => {
			if (testResult.failureMessage) {
			  console.error(testResult.failureMessage);
			}
		  });

		  c();
		})
		.catch(errorCaughtByJestRunner => {
		  e(errorCaughtByJestRunner);
		});

	});
}
