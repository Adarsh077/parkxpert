const axios = require('axios').default;

class IotService {
  async openExitBarricate() {
    try {
      console.log('CALLED openExitBarricate');
      const response = await axios.get(
        `${process.env.EXIT_MODULE_IP_ADDRESS}/hello`
      );
      console.log(response);
    } catch (e) {
      console.log('Could not open gate!');
    }
  }
}

module.exports = new IotService();
