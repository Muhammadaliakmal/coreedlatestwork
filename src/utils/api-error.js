class ApiError extends Error {
  constructor(statusCode, message = "Error occurred😜", error = [],stack = "") {
    super(message)
    this.statusCode = statusCode  
    this.data = null
    this.error = error
    this.message = message
    this.stack = stack

    if(stack){
      this.stack = stack
    }else{
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export {ApiError}