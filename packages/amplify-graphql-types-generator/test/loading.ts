import * as path from 'path';

import { loadAndMergeQueryDocuments } from '../src/loading';

describe('Validation', () => {
  test(`should extract gql snippet from javascript file`, () => {
    const inputPaths = [
      path.join(__dirname, './fixtures/starwars/gqlQueries.js'),
    ];

    const document = loadAndMergeQueryDocuments(inputPaths);

    expect(document).toMatchSnapshot();
  })
  test(`should throw a helpful message when a file has invalid gql snippets`, () => {
    const inputPaths = [
      path.join(__dirname, './fixtures/misc/invalid-gqlQueries.js'),
    ];
    expect(() => {
      loadAndMergeQueryDocuments(inputPaths);
    }).toThrowErrorMatchingSnapshot();
  })
});
