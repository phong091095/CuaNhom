/** Lỗi nhập liệu gắn với một ô cụ thể, để hiện ngay dưới ô (KE_HOACH_GIAO_DIEN D5, B2). */
export class ValidationError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`Không tìm thấy ${what}`);
    this.name = 'NotFoundError';
  }
}
