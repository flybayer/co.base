export default class Err extends Error {
  constructor(message, name, detail) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Err);
    }
    this.name = name;
    this.detail = detail;
  }

  toJSON() {
    return {
      detail: this.detail,
      name: this.name,
      message: this.message,
    };
  }

}
