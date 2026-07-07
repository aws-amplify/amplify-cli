// swiftlint:disable all
import Amplify
import Foundation

extension Todo {
  // MARK: - CodingKeys 
   public enum CodingKeys: String, ModelKey {
    case id
    case name
    case description
    case createdAt
    case updatedAt
  }
  
  public static let keys = CodingKeys.self
  //  MARK: - ModelSchema 
  
  public static let schema = defineSchema { model in
    let todo = Todo.keys
    
    model.listPluralName = "Todos"
    model.syncPluralName = "Todos"
    
    model.attributes(
      .primaryKey(fields: [todo.id])
    )
    
    model.fields(
      .field(todo.id, is: .required, ofType: .string),
      .field(todo.name, is: .required, ofType: .string),
      .field(todo.description, is: .optional, ofType: .string),
      .field(todo.createdAt, is: .optional, isReadOnly: true, ofType: .dateTime),
      .field(todo.updatedAt, is: .optional, isReadOnly: true, ofType: .dateTime)
    )
    }
}

extension Todo: ModelIdentifiable {
  public typealias IdentifierFormat = ModelIdentifierFormat.Default
  public typealias IdentifierProtocol = DefaultModelIdentifier<Self>
}