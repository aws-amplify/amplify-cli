/* tslint:disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from '@angular/core';
import API, { graphqlOperation } from '@aws-amplify/api';
import { GraphQLResult } from '@aws-amplify/api/lib/types';
import * as Observable from 'zen-observable';

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

export type HeroQuery = {
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
};

export type ReviewsQuery = {
  episode: Episode | null;
  stars: number;
  commentary: string | null;
};

export type SearchQuery = {};

export type CharacterQuery = {
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
};

export type DroidQuery = {
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
};

export type HumanQuery = {
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
};

export type StarshipQuery = {
  id: string;
  name: string;
  length: number | null;
  coordinates: Array<Array<number>> | null;
};

export type CreateReviewMutation = {
  episode: Episode | null;
  stars: number;
  commentary: string | null;
};

export type ReviewAddedSubscription = {
  episode: Episode | null;
  stars: number;
  commentary: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class APIService {
  async Hero(episode?: Episode): Promise<HeroQuery> {
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
    const gqlAPIServiceArguments: any = {};
    if (episode) {
      gqlAPIServiceArguments.episode = episode;
    }
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <HeroQuery>response.data.hero;
  }
  async Reviews(episode: Episode): Promise<ReviewsQuery> {
    const statement = `query Reviews($episode: Episode!) {
        reviews(episode: $episode) {
          episode
          stars
          commentary
        }
      }`;
    const gqlAPIServiceArguments: any = {
      episode,
    };
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <ReviewsQuery>response.data.reviews;
  }
  async Search(text?: string): Promise<SearchQuery> {
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
    const gqlAPIServiceArguments: any = {};
    if (text) {
      gqlAPIServiceArguments.text = text;
    }
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <SearchQuery>response.data.search;
  }
  async Character(id: string): Promise<CharacterQuery> {
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
    const gqlAPIServiceArguments: any = {
      id,
    };
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <CharacterQuery>response.data.character;
  }
  async Droid(id: string): Promise<DroidQuery> {
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
    const gqlAPIServiceArguments: any = {
      id,
    };
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <DroidQuery>response.data.droid;
  }
  async Human(id: string): Promise<HumanQuery> {
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
    const gqlAPIServiceArguments: any = {
      id,
    };
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <HumanQuery>response.data.human;
  }
  async Starship(id: string): Promise<StarshipQuery> {
    const statement = `query Starship($id: ID!) {
        starship(id: $id) {
          id
          name
          length
          coordinates
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id,
    };
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <StarshipQuery>response.data.starship;
  }
  async CreateReview(review: ReviewInput, episode?: Episode): Promise<CreateReviewMutation> {
    const statement = `mutation CreateReview($episode: Episode, $review: ReviewInput!) {
        createReview(episode: $episode, review: $review) {
          episode
          stars
          commentary
        }
      }`;
    const gqlAPIServiceArguments: any = {
      review,
    };
    if (episode) {
      gqlAPIServiceArguments.episode = episode;
    }
    const response = (await API.graphql(graphqlOperation(statement, gqlAPIServiceArguments))) as any;
    return <CreateReviewMutation>response.data.createReview;
  }
  ReviewAddedListener: Observable<ReviewAddedSubscription> = API.graphql(
    graphqlOperation(
      `subscription ReviewAdded($episode: Episode) {
        reviewAdded(episode: $episode) {
          episode
          stars
          commentary
        }
      }`
    )
  ) as Observable<ReviewAddedSubscription>;
}
