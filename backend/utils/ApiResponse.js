class ApiResponse {
  constructor(statusCode, data, message = "Succes") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static conflict(message = "Conflit") {
    return new ApiResponse(409, null, message);
  }

  static success(data, message = "Succes") {
    return new ApiResponse(200, data, message);
  }

  static created(data, message = "Cree avec succes") {
    return new ApiResponse(201, data, message);
  }

  static noContent(message = "Aucun contenu") {
    return new ApiResponse(204, null, message);
  }

  static badRequest(message = "Requete invalide") {
    return new ApiResponse(400, null, message);
  }

  static unauthorized(message = "Non autorise") {
    return new ApiResponse(401, null, message);
  }

  static forbidden(message = "Interdit") {
    return new ApiResponse(403, null, message);
  }

  static notFound(message = "Introuvable") {
    return new ApiResponse(404, null, message);
  }

  static internalServerError(message = "Erreur interne du serveur") {
    return new ApiResponse(500, null, message);
  }

  static error(message = "Erreur", statusCode = 500) {
    return new ApiResponse(statusCode, null, message);
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}

module.exports = ApiResponse;
