/* tslint:disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from '@angular/core';
import { graphqlOperation } from 'aws-amplify';
import { AmplifyService } from 'aws-amplify-angular';
@Injectable({
  providedIn: 'root',
})
export enum Episode {
  NEWHOPE = 'NEWHOPE',
  EMPIRE = 'EMPIRE',
  JEDI = 'JEDI',
}

export type ReviewInput = {
  stars: number;
  commentary?: string | null;
  favorite_color?: ColorInput | null;
};

export type ColorInput = {
  red: number;
  green: number;
  blue: number;
};

export type HeroQueryVariables = {
  episode?: Episode | null;
};

export type HeroQuery = {
  hero:
    | (
        | {
            id: string;
            name: string;
            friends: Array<
              | (
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      homePlanet: string | null;
                      height: number | null;
                      mass: number | null;
                      starships: Array<{
                        id: string;
                        name: string;
                        length: number | null;
                        coordinates: Array<Array<number>> | null;
                      } | null> | null;
                    }
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      primaryFunction: string | null;
                    })
              | null
            > | null;
            friendsConnection: {
              totalCount: number | null;
              edges: Array<{
                cursor: string;
              } | null> | null;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
            };
            appearsIn: Array<Episode | null>;
            homePlanet: string | null;
            height: number | null;
            mass: number | null;
            starships: Array<{
              id: string;
              name: string;
              length: number | null;
              coordinates: Array<Array<number>> | null;
            } | null> | null;
          }
        | {
            id: string;
            name: string;
            friends: Array<
              | (
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      homePlanet: string | null;
                      height: number | null;
                      mass: number | null;
                      starships: Array<{
                        id: string;
                        name: string;
                        length: number | null;
                        coordinates: Array<Array<number>> | null;
                      } | null> | null;
                    }
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      primaryFunction: string | null;
                    })
              | null
            > | null;
            friendsConnection: {
              totalCount: number | null;
              edges: Array<{
                cursor: string;
              } | null> | null;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
            };
            appearsIn: Array<Episode | null>;
            primaryFunction: string | null;
          })
    | null;
};

export type ReviewsQueryVariables = {
  episode: Episode;
};

export type ReviewsQuery = {
  reviews: Array<{
    episode: Episode | null;
    stars: number;
    commentary: string | null;
  } | null> | null;
};

export type SearchQueryVariables = {
  text?: string | null;
};

export type SearchQuery = {
  search: Array<
    | (
        | {
            id: string;
            name: string;
            homePlanet: string | null;
            height: number | null;
            mass: number | null;
            friends: Array<
              | (
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      homePlanet: string | null;
                      height: number | null;
                      mass: number | null;
                    }
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      primaryFunction: string | null;
                    })
              | null
            > | null;
            friendsConnection: {
              totalCount: number | null;
              edges: Array<{
                cursor: string;
              } | null> | null;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
            };
            appearsIn: Array<Episode | null>;
            starships: Array<{
              id: string;
              name: string;
              length: number | null;
              coordinates: Array<Array<number>> | null;
            } | null> | null;
          }
        | {
            id: string;
            name: string;
            friends: Array<
              | (
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      homePlanet: string | null;
                      height: number | null;
                      mass: number | null;
                    }
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      primaryFunction: string | null;
                    })
              | null
            > | null;
            friendsConnection: {
              totalCount: number | null;
              edges: Array<{
                cursor: string;
              } | null> | null;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
            };
            appearsIn: Array<Episode | null>;
            primaryFunction: string | null;
          }
        | {
            id: string;
            name: string;
            length: number | null;
            coordinates: Array<Array<number>> | null;
          })
    | null
  > | null;
};

export type CharacterQueryVariables = {
  id: string;
};

export type CharacterQuery = {
  character:
    | (
        | {
            id: string;
            name: string;
            friends: Array<
              | (
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      homePlanet: string | null;
                      height: number | null;
                      mass: number | null;
                      starships: Array<{
                        id: string;
                        name: string;
                        length: number | null;
                        coordinates: Array<Array<number>> | null;
                      } | null> | null;
                    }
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      primaryFunction: string | null;
                    })
              | null
            > | null;
            friendsConnection: {
              totalCount: number | null;
              edges: Array<{
                cursor: string;
              } | null> | null;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
            };
            appearsIn: Array<Episode | null>;
            homePlanet: string | null;
            height: number | null;
            mass: number | null;
            starships: Array<{
              id: string;
              name: string;
              length: number | null;
              coordinates: Array<Array<number>> | null;
            } | null> | null;
          }
        | {
            id: string;
            name: string;
            friends: Array<
              | (
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      homePlanet: string | null;
                      height: number | null;
                      mass: number | null;
                      starships: Array<{
                        id: string;
                        name: string;
                        length: number | null;
                        coordinates: Array<Array<number>> | null;
                      } | null> | null;
                    }
                  | {
                      id: string;
                      name: string;
                      friends: Array<
                        | (
                            | {
                                id: string;
                                name: string;
                                homePlanet: string | null;
                                height: number | null;
                                mass: number | null;
                              }
                            | {
                                id: string;
                                name: string;
                                primaryFunction: string | null;
                              })
                        | null
                      > | null;
                      friendsConnection: {
                        totalCount: number | null;
                        edges: Array<{
                          cursor: string;
                        } | null> | null;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  friends: Array<
                                    | (
                                        | {
                                            id: string;
                                            name: string;
                                            homePlanet: string | null;
                                            height: number | null;
                                            mass: number | null;
                                          }
                                        | {
                                            id: string;
                                            name: string;
                                            primaryFunction: string | null;
                                          })
                                    | null
                                  > | null;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                      };
                      appearsIn: Array<Episode | null>;
                      primaryFunction: string | null;
                    })
              | null
            > | null;
            friendsConnection: {
              totalCount: number | null;
              edges: Array<{
                cursor: string;
              } | null> | null;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
            };
            appearsIn: Array<Episode | null>;
            primaryFunction: string | null;
          })
    | null;
};

export type DroidQueryVariables = {
  id: string;
};

export type DroidQuery = {
  droid: {
    id: string;
    name: string;
    friends: Array<
      | (
          | {
              id: string;
              name: string;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                        starships: Array<{
                          id: string;
                          name: string;
                          length: number | null;
                          coordinates: Array<Array<number>> | null;
                        } | null> | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
              friendsConnection: {
                totalCount: number | null;
                edges: Array<{
                  cursor: string;
                } | null> | null;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
              };
              appearsIn: Array<Episode | null>;
              homePlanet: string | null;
              height: number | null;
              mass: number | null;
              starships: Array<{
                id: string;
                name: string;
                length: number | null;
                coordinates: Array<Array<number>> | null;
              } | null> | null;
            }
          | {
              id: string;
              name: string;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                        starships: Array<{
                          id: string;
                          name: string;
                          length: number | null;
                          coordinates: Array<Array<number>> | null;
                        } | null> | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
              friendsConnection: {
                totalCount: number | null;
                edges: Array<{
                  cursor: string;
                } | null> | null;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
              };
              appearsIn: Array<Episode | null>;
              primaryFunction: string | null;
            })
      | null
    > | null;
    friendsConnection: {
      totalCount: number | null;
      edges: Array<{
        cursor: string;
      } | null> | null;
      friends: Array<
        | (
            | {
                id: string;
                name: string;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
                homePlanet: string | null;
                height: number | null;
                mass: number | null;
              }
            | {
                id: string;
                name: string;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
                primaryFunction: string | null;
              })
        | null
      > | null;
    };
    appearsIn: Array<Episode | null>;
    primaryFunction: string | null;
  } | null;
};

export type HumanQueryVariables = {
  id: string;
};

export type HumanQuery = {
  human: {
    id: string;
    name: string;
    homePlanet: string | null;
    height: number | null;
    mass: number | null;
    friends: Array<
      | (
          | {
              id: string;
              name: string;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                        starships: Array<{
                          id: string;
                          name: string;
                          length: number | null;
                          coordinates: Array<Array<number>> | null;
                        } | null> | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
              friendsConnection: {
                totalCount: number | null;
                edges: Array<{
                  cursor: string;
                } | null> | null;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
              };
              appearsIn: Array<Episode | null>;
              homePlanet: string | null;
              height: number | null;
              mass: number | null;
              starships: Array<{
                id: string;
                name: string;
                length: number | null;
                coordinates: Array<Array<number>> | null;
              } | null> | null;
            }
          | {
              id: string;
              name: string;
              friends: Array<
                | (
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        homePlanet: string | null;
                        height: number | null;
                        mass: number | null;
                        starships: Array<{
                          id: string;
                          name: string;
                          length: number | null;
                          coordinates: Array<Array<number>> | null;
                        } | null> | null;
                      }
                    | {
                        id: string;
                        name: string;
                        friends: Array<
                          | (
                              | {
                                  id: string;
                                  name: string;
                                  homePlanet: string | null;
                                  height: number | null;
                                  mass: number | null;
                                }
                              | {
                                  id: string;
                                  name: string;
                                  primaryFunction: string | null;
                                })
                          | null
                        > | null;
                        friendsConnection: {
                          totalCount: number | null;
                          edges: Array<{
                            cursor: string;
                          } | null> | null;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    friends: Array<
                                      | (
                                          | {
                                              id: string;
                                              name: string;
                                              homePlanet: string | null;
                                              height: number | null;
                                              mass: number | null;
                                            }
                                          | {
                                              id: string;
                                              name: string;
                                              primaryFunction: string | null;
                                            })
                                      | null
                                    > | null;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                        };
                        appearsIn: Array<Episode | null>;
                        primaryFunction: string | null;
                      })
                | null
              > | null;
              friendsConnection: {
                totalCount: number | null;
                edges: Array<{
                  cursor: string;
                } | null> | null;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          friends: Array<
                            | (
                                | {
                                    id: string;
                                    name: string;
                                    homePlanet: string | null;
                                    height: number | null;
                                    mass: number | null;
                                  }
                                | {
                                    id: string;
                                    name: string;
                                    primaryFunction: string | null;
                                  })
                            | null
                          > | null;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
              };
              appearsIn: Array<Episode | null>;
              primaryFunction: string | null;
            })
      | null
    > | null;
    friendsConnection: {
      totalCount: number | null;
      edges: Array<{
        cursor: string;
      } | null> | null;
      friends: Array<
        | (
            | {
                id: string;
                name: string;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
                homePlanet: string | null;
                height: number | null;
                mass: number | null;
              }
            | {
                id: string;
                name: string;
                friends: Array<
                  | (
                      | {
                          id: string;
                          name: string;
                          homePlanet: string | null;
                          height: number | null;
                          mass: number | null;
                        }
                      | {
                          id: string;
                          name: string;
                          primaryFunction: string | null;
                        })
                  | null
                > | null;
                primaryFunction: string | null;
              })
        | null
      > | null;
    };
    appearsIn: Array<Episode | null>;
    starships: Array<{
      id: string;
      name: string;
      length: number | null;
      coordinates: Array<Array<number>> | null;
    } | null> | null;
  } | null;
};

export type StarshipQueryVariables = {
  id: string;
};

export type StarshipQuery = {
  starship: {
    id: string;
    name: string;
    length: number | null;
    coordinates: Array<Array<number>> | null;
  } | null;
};

export type CreateReviewMutationVariables = {
  episode?: Episode | null;
  review: ReviewInput;
};

export type CreateReviewMutation = {
  createReview: {
    episode: Episode | null;
    stars: number;
    commentary: string | null;
  } | null;
};

export type ReviewAddedSubscriptionVariables = {
  episode?: Episode | null;
};

export type ReviewAddedSubscription = {
  reviewAdded: {
    episode: Episode | null;
    stars: number;
    commentary: string | null;
  } | null;
};

export class AppSyncService {
  constructor(private amplifyService: AmplifyService) {}

  async Hero(input: HeroQueryVariables): HeroQuery {
    const statement = `query Hero($episode: Episode) {
  hero(episode: $episode) {
    id
    name
    friends {
      id
      name
      friends {
        id
        name
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
      friendsConnection {
        totalCount
        edges {
          cursor
        }
        friends {
          id
          name
          friends {
            id
            name
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
      }
      appearsIn
      ... on Human {
        homePlanet
        height
        mass
        starships {
          id
          name
          length
          coordinates
        }
      }
      ... on Droid {
        primaryFunction
      }
    }
    friendsConnection {
      totalCount
      edges {
        cursor
      }
      friends {
        id
        name
        friends {
          id
          name
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
    }
    appearsIn
    ... on Human {
      homePlanet
      height
      mass
      starships {
        id
        name
        length
        coordinates
      }
    }
    ... on Droid {
      primaryFunction
    }
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <HeroQuery>response.data.Hero.items;
  }
  async Reviews(input: ReviewsQueryVariables): ReviewsQuery {
    const statement = `query Reviews($episode: Episode!) {
  reviews(episode: $episode) {
    episode
    stars
    commentary
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <ReviewsQuery>response.data.Reviews.items;
  }
  async Search(input: SearchQueryVariables): SearchQuery {
    const statement = `query Search($text: String) {
  search(text: $text) {
    ... on Human {
      id
      name
      homePlanet
      height
      mass
      friends {
        id
        name
        friends {
          id
          name
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
      friendsConnection {
        totalCount
        edges {
          cursor
        }
        friends {
          id
          name
          friends {
            id
            name
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
      }
      appearsIn
      starships {
        id
        name
        length
        coordinates
      }
    }
    ... on Droid {
      id
      name
      friends {
        id
        name
        friends {
          id
          name
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
      friendsConnection {
        totalCount
        edges {
          cursor
        }
        friends {
          id
          name
          friends {
            id
            name
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
      }
      appearsIn
      primaryFunction
    }
    ... on Starship {
      id
      name
      length
      coordinates
    }
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <SearchQuery>response.data.Search.items;
  }
  async Character(input: CharacterQueryVariables): CharacterQuery {
    const statement = `query Character($id: ID!) {
  character(id: $id) {
    id
    name
    friends {
      id
      name
      friends {
        id
        name
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
      friendsConnection {
        totalCount
        edges {
          cursor
        }
        friends {
          id
          name
          friends {
            id
            name
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
      }
      appearsIn
      ... on Human {
        homePlanet
        height
        mass
        starships {
          id
          name
          length
          coordinates
        }
      }
      ... on Droid {
        primaryFunction
      }
    }
    friendsConnection {
      totalCount
      edges {
        cursor
      }
      friends {
        id
        name
        friends {
          id
          name
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
    }
    appearsIn
    ... on Human {
      homePlanet
      height
      mass
      starships {
        id
        name
        length
        coordinates
      }
    }
    ... on Droid {
      primaryFunction
    }
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <CharacterQuery>response.data.Character.items;
  }
  async Droid(input: DroidQueryVariables): DroidQuery {
    const statement = `query Droid($id: ID!) {
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
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        friendsConnection {
          totalCount
          edges {
            cursor
          }
          friends {
            id
            name
            friends {
              id
              name
              ... on Human {
                homePlanet
                height
                mass
              }
              ... on Droid {
                primaryFunction
              }
            }
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
        }
        appearsIn
        ... on Human {
          homePlanet
          height
          mass
          starships {
            id
            name
            length
            coordinates
          }
        }
        ... on Droid {
          primaryFunction
        }
      }
      friendsConnection {
        totalCount
        edges {
          cursor
        }
        friends {
          id
          name
          friends {
            id
            name
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
      }
      appearsIn
      ... on Human {
        homePlanet
        height
        mass
        starships {
          id
          name
          length
          coordinates
        }
      }
      ... on Droid {
        primaryFunction
      }
    }
    friendsConnection {
      totalCount
      edges {
        cursor
      }
      friends {
        id
        name
        friends {
          id
          name
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
    }
    appearsIn
    primaryFunction
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <DroidQuery>response.data.Droid.items;
  }
  async Human(input: HumanQueryVariables): HumanQuery {
    const statement = `query Human($id: ID!) {
  human(id: $id) {
    id
    name
    homePlanet
    height
    mass
    friends {
      id
      name
      friends {
        id
        name
        friends {
          id
          name
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        friendsConnection {
          totalCount
          edges {
            cursor
          }
          friends {
            id
            name
            friends {
              id
              name
              ... on Human {
                homePlanet
                height
                mass
              }
              ... on Droid {
                primaryFunction
              }
            }
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
        }
        appearsIn
        ... on Human {
          homePlanet
          height
          mass
          starships {
            id
            name
            length
            coordinates
          }
        }
        ... on Droid {
          primaryFunction
        }
      }
      friendsConnection {
        totalCount
        edges {
          cursor
        }
        friends {
          id
          name
          friends {
            id
            name
            ... on Human {
              homePlanet
              height
              mass
            }
            ... on Droid {
              primaryFunction
            }
          }
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
      }
      appearsIn
      ... on Human {
        homePlanet
        height
        mass
        starships {
          id
          name
          length
          coordinates
        }
      }
      ... on Droid {
        primaryFunction
      }
    }
    friendsConnection {
      totalCount
      edges {
        cursor
      }
      friends {
        id
        name
        friends {
          id
          name
          ... on Human {
            homePlanet
            height
            mass
          }
          ... on Droid {
            primaryFunction
          }
        }
        ... on Human {
          homePlanet
          height
          mass
        }
        ... on Droid {
          primaryFunction
        }
      }
    }
    appearsIn
    starships {
      id
      name
      length
      coordinates
    }
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <HumanQuery>response.data.Human.items;
  }
  async Starship(input: StarshipQueryVariables): StarshipQuery {
    const statement = `query Starship($id: ID!) {
  starship(id: $id) {
    id
    name
    length
    coordinates
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <StarshipQuery>response.data.Starship.items;
  }
  async CreateReview(input: CreateReviewMutationVariables): CreateReviewMutation {
    const statement = `mutation CreateReview($episode: Episode, $review: ReviewInput!) {
  createReview(episode: $episode, review: $review) {
    episode
    stars
    commentary
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <CreateReviewMutation>response.data.CreateReview.items;
  }
  async ReviewAdded(input: ReviewAddedSubscriptionVariables): ReviewAddedSubscription {
    const statement = `subscription ReviewAdded($episode: Episode) {
  reviewAdded(episode: $episode) {
    episode
    stars
    commentary
  }
}`;
    const response = await this.amplifyService.api().graphql(graphqlOperation(statement, input));
    return <ReviewAddedSubscription>response.data.ReviewAdded.items;
  }
}
