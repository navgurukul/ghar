const QRCode = require('qrcode');

class QRCodeGenerator {
  async generateQRCode(data, size, eccLevel) {
    if (!data) {
      throw new Error('Missing "data" field in the request payload');
    }

    try {
    // genrate qr code url with the respected data
      const qrCodeUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: eccLevel,
        width: size,
      });

      //return the qrcode url
      return qrCodeUrl;
    } catch (error) {
      throw new Error('Error generating QR code');
    }
  }
}

module.exports = new QRCodeGenerator();
