/**
 * Convert JSON test reports to JUnit XML format
 * This script reads the combined-report.json and generates a combined-report.xml
 */

const fs = require('fs');
const path = require('path');

const testResultsDir = path.join(__dirname, '..', 'test-results');
const inputFile = path.join(testResultsDir, 'combined-report.json');
const outputFile = path.join(testResultsDir, 'combined-report.xml');

function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function parseJestResults(jestJson) {
    const testsuites = [];
    
    if (!jestJson || !jestJson.testResults) {
        return testsuites;
    }

    for (const testFile of jestJson.testResults) {
        const testsuite = {
            name: path.basename(testFile.name),
            tests: 0,
            failures: 0,
            errors: 0,
            time: ((testFile.endTime - testFile.startTime) / 1000).toFixed(3),
            testcases: []
        };

        for (const assertion of testFile.assertionResults || []) {
            testsuite.tests++;
            const testcase = {
                name: assertion.title,
                classname: assertion.ancestorTitles.join(' > ') || testsuite.name,
                time: '0.001'
            };

            if (assertion.status === 'failed') {
                testsuite.failures++;
                testcase.failure = {
                    message: assertion.failureMessages.join('\n')
                };
            }

            testsuite.testcases.push(testcase);
        }

        testsuites.push(testsuite);
    }

    return testsuites;
}

function parsePlaywrightResults(pwJson, browser) {
    const testsuites = [];

    if (!pwJson || !pwJson.suites) {
        return testsuites;
    }

    function processSuite(suite, parentName = '') {
        const suiteName = parentName ? `${parentName} > ${suite.title}` : suite.title;
        
        if (suite.specs && suite.specs.length > 0) {
            const testsuite = {
                name: `${browser}: ${suiteName}`,
                tests: 0,
                failures: 0,
                errors: 0,
                time: '0',
                testcases: []
            };

            for (const spec of suite.specs) {
                for (const test of spec.tests || []) {
                    testsuite.tests++;
                    const result = test.results && test.results[0];
                    const testcase = {
                        name: spec.title,
                        classname: suiteName,
                        time: result ? (result.duration / 1000).toFixed(3) : '0'
                    };

                    if (result && result.status === 'failed') {
                        testsuite.failures++;
                        testcase.failure = {
                            message: result.error ? result.error.message : 'Test failed'
                        };
                    }

                    testsuite.testcases.push(testcase);
                }
            }

            if (testsuite.tests > 0) {
                testsuites.push(testsuite);
            }
        }

        for (const childSuite of suite.suites || []) {
            testsuites.push(...processSuite(childSuite, suiteName));
        }
    }

    for (const suite of pwJson.suites) {
        testsuites.push(...processSuite(suite));
    }

    return testsuites;
}

function generateJunitXml(testsuites) {
    let totalTests = 0;
    let totalFailures = 0;
    let totalErrors = 0;
    let totalTime = 0;

    for (const suite of testsuites) {
        totalTests += suite.tests;
        totalFailures += suite.failures;
        totalErrors += suite.errors;
        totalTime += parseFloat(suite.time) || 0;
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuites tests="${totalTests}" failures="${totalFailures}" errors="${totalErrors}" time="${totalTime.toFixed(3)}">\n`;

    for (const suite of testsuites) {
        xml += `  <testsuite name="${escapeXml(suite.name)}" tests="${suite.tests}" failures="${suite.failures}" errors="${suite.errors}" time="${suite.time}">\n`;
        
        for (const testcase of suite.testcases) {
            xml += `    <testcase name="${escapeXml(testcase.name)}" classname="${escapeXml(testcase.classname)}" time="${testcase.time}"`;
            
            if (testcase.failure) {
                xml += `>\n`;
                xml += `      <failure message="${escapeXml(testcase.failure.message)}">${escapeXml(testcase.failure.message)}</failure>\n`;
                xml += `    </testcase>\n`;
            } else {
                xml += `/>\n`;
            }
        }
        
        xml += `  </testsuite>\n`;
    }

    xml += `</testsuites>\n`;
    return xml;
}

// Main execution
try {
    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        // Create empty report
        const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="0" failures="0" errors="0" time="0"></testsuites>\n`;
        fs.writeFileSync(outputFile, emptyXml);
        console.log('Created empty JUnit report');
        process.exit(0);
    }

    const combined = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const allTestsuites = [];

    // Parse Jest/API test results
    if (combined.jest) {
        allTestsuites.push(...parseJestResults(combined.jest));
    }

    // Parse Playwright results for each browser
    if (combined.playwright) {
        for (const [browser, results] of Object.entries(combined.playwright)) {
            if (results) {
                allTestsuites.push(...parsePlaywrightResults(results, browser));
            }
        }
    }

    const junitXml = generateJunitXml(allTestsuites);
    fs.writeFileSync(outputFile, junitXml);
    
    console.log(`JUnit XML report generated: ${outputFile}`);
    console.log(`Total test suites: ${allTestsuites.length}`);
} catch (error) {
    console.error('Error generating JUnit report:', error);
    process.exit(1);
}
