class SSEService {
  constructor() {
    this.clients = [];
  }

  async registerClient({ clientId, response }) {
    this.clients.push({
      clientId,
      response,
    });
  }

  async removeClient({ clientId }) {
    this.clients = this.clients.filter(
      (client) => client.clientId !== clientId
    );
  }

  async sendEvent({ data }) {
    this.clients.forEach((client) => {
      client.response.write('event: message\n');
      client.response.write(`data: ${JSON.stringify({ ...data })}\n\n`);
    });
  }
}

module.exports = new SSEService();
