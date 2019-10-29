/* tslint:disable */
//  This file was automatically generated and should not be edited.

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
