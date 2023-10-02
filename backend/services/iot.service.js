class IotService {
  async displayQrCode({ link }) {
    // TODO: Generate Qrcode and call the api to display qrcode
    console.log(`Display QR Code: ${link}`);
  }

  async openExitBarricate() {
    // TODO: call the api to open exit barricate
    console.log('CALLED openExitBarricate');
  }
}

module.exports = new IotService();
