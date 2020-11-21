export class Error400 extends Error {
  detail: { message: string; name: string; data?: any };
  constructor(detail: { message: string; name: string; data?: any }) {
    super(detail.message);
    this.detail = detail;
  }
}
export class Error403 extends Error {
  detail: { message: string; name: string; data?: any };
  constructor(detail: { message: string; name: string; data?: any }) {
    super(detail.message);
    this.detail = detail;
  }
}

export class Error404 extends Error {
  detail: { message: string; name: string; data?: any };
  constructor(detail: { message: string; name: string; data?: any }) {
    super(detail.message);
    this.detail = detail;
  }
}

export class Error500 extends Error {
  detail: { message: string; name: string; data?: any };
  constructor(detail: { message: string; name: string; data?: any }) {
    super(detail.message);
    this.detail = detail;
  }
}
