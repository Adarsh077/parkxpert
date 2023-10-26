const axios = require('axios').default;

class IotService {
  async openExitBarricate() {
    console.log('CALLED openExitBarricate');
    const response = await axios.get(`${process.env.EXIT_MODULE_IP_ADDRESS}/hello`);
    console.log(response);
  }
}

module.exports = new IotService();
