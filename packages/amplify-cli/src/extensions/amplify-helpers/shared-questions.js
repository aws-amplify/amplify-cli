const sharedQuestions = {
  accessLevel: (entity) => {
    return {
      "name": "accessLevel",
      "type": "list",
      "message": `Please choose the level of access required to access this ${entity}:`,
      "required": true,
      "choices": [
        "Public",
        "Private",
        "Protected"
      ]
    }
  }
}

module.exports = {
  sharedQuestions
}