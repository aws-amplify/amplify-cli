export const validSchema100Subscriptions = `
# This is a 100 subscription schema

type Blog @model {
  id: ID!
  name: String!
  posts: [Post] @hasMany
}

type Post @model {
  id: ID!
  title: String!
  blog: Blog @belongsTo
  comments: [Comment] @hasMany
}

type Comment @model {
  id: ID!
  post: Post @belongsTo
  content: String!
}

type Ab @model {
  id: ID!
}

type Bb @model {
  id: ID!
}

type Cb @model {
  id: ID!
}

type Db @model {
  id: ID!
}

type Eb @model {
  id: ID!
}

type Fb @model {
  id: ID!
}

type Gb @model {
  id: ID!
}

type Hb @model {
  id: ID!
}

type Ib @model {
  id: ID!
}

type Jb @model {
  id: ID!
}

type Kb @model {
  id: ID!
}

type Lb @model {
  id: ID!
}

type Mb @model {
  id: ID!
}

type Nb @model {
  id: ID!
}

type Ob @model {
  id: ID!
}

type Pb @model {
  id: ID!
}

type Qb @model {
  id: ID!
}

type Rb @model {
  id: ID!
}

type Sb @model {
  id: ID!
}

type Tb @model {
  id: ID!
}

type Ub @model {
  id: ID!
}

type Vb @model {
  id: ID!
}

type Wb @model {
  id: ID!
}

type Xb @model {
  id: ID!
}

type Yb @model {
  id: ID!
}

type Zb @model {
  id: ID!
}

type Ac @model {
  id: ID!
}

type Ad @model {
  id: ID!
}

type Ae @model(subscriptions: { onDelete: null }) {
  id: ID!
}

type Af @model(subscriptions: null) {
  id: ID!
}

type Ag @model(subscriptions: { onUpdate: null }) {
  id: ID!
}

type Ah @model {
  id: ID!
}

type Ai @model(subscriptions: { onUpdate: null, onDelete: null, onCreate: null }) {
  id: ID!
}
`

export const invalidSchema101Subscriptions = `
# This is a 101 subscription schema

type Blog @model {
  id: ID!
  name: String!
  posts: [Post] @hasMany
}

type Post @model {
  id: ID!
  title: String!
  blog: Blog @belongsTo
  comments: [Comment] @hasMany
}

type Comment @model {
  id: ID!
  post: Post @belongsTo
  content: String!
}

type Ab @model {
  id: ID!
}

type Bb @model {
  id: ID!
}

type Cb @model {
  id: ID!
}

type Db @model {
  id: ID!
}

type Eb @model {
  id: ID!
}

type Fb @model {
  id: ID!
}

type Gb @model {
  id: ID!
}

type Hb @model {
  id: ID!
}

type Ib @model {
  id: ID!
}

type Jb @model {
  id: ID!
}

type Kb @model {
  id: ID!
}

type Lb @model {
  id: ID!
}

type Mb @model {
  id: ID!
}

type Nb @model {
  id: ID!
}

type Ob @model {
  id: ID!
}

type Pb @model {
  id: ID!
}

type Qb @model {
  id: ID!
}

type Rb @model {
  id: ID!
}

type Sb @model {
  id: ID!
}

type Tb @model {
  id: ID!
}

type Ub @model {
  id: ID!
}

type Vb @model {
  id: ID!
}

type Wb @model {
  id: ID!
}

type Xb @model {
  id: ID!
}

type Yb @model {
  id: ID!
}

type Zb @model {
  id: ID!
}

type Ac @model {
  id: ID!
}

type Ad @model {
  id: ID!
}

type Ae @model(subscriptions: { onDelete: null }) {
  id: ID!
}

type Af @model(subscriptions: null) {
  id: ID!
}

type Ag @model {
  id: ID!
}

type Ah @model {
  id: ID!
}
`;