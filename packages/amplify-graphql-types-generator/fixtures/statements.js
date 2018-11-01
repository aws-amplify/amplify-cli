// eslint-disable
// this is an auto generated file. This will be overwritten

export const hero = `query Hero($episode: Episode) {
  hero(episode: $episode) {
    id
    name
    friends {
      id
      name
      friends {
        id
        name
        appearsIn
        ... on Human {
          homePlanet
        }
        ... on Droid {
          primaryFunction
        }
      }
      appearsIn
      ... on Human {
        homePlanet
      }
      ... on Droid {
        primaryFunction
      }
    }
    appearsIn
    ... on Human {
      homePlanet
    }
    ... on Droid {
      primaryFunction
    }
  }
}
`;
export const human = `query Human($id: String!) {
  human(id: $id) {
    id
    name
    friends {
      id
      name
      friends {
        id
        name
        friends {
          id
          name
          appearsIn
          ... on Human {
            homePlanet
          }
          ... on Droid {
            primaryFunction
          }
        }
        appearsIn
        ... on Human {
          homePlanet
        }
        ... on Droid {
          primaryFunction
        }
      }
      appearsIn
      ... on Human {
        homePlanet
      }
      ... on Droid {
        primaryFunction
      }
    }
    appearsIn
    homePlanet
  }
}
`;
export const droid = `query Droid($id: String!) {
  droid(id: $id) {
    id
    name
    friends {
      id
      name
      friends {
        id
        name
        friends {
          id
          name
          appearsIn
          ... on Human {
            homePlanet
          }
          ... on Droid {
            primaryFunction
          }
        }
        appearsIn
        ... on Human {
          homePlanet
        }
        ... on Droid {
          primaryFunction
        }
      }
      appearsIn
      ... on Human {
        homePlanet
      }
      ... on Droid {
        primaryFunction
      }
    }
    appearsIn
    primaryFunction
  }
}
`;
