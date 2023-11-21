const QRCode = require('qrcode');
const fs = require('fs');

class QRCodeGenerator {
  async generateQRCode(data, size, eccLevel) {
    if (!data) {
      throw new Error('Missing "data" field in the request payload');
    }

    try {
      // Generate QR code image with the provided data
      const filePath = `${data}_qrcode.png`; // Specify the file path
      await QRCode.toFile(filePath, data, {
        errorCorrectionLevel: eccLevel,
        width: size,
        margin: 1,
      });

      // Read the generated QR code image
      const qrCodeImage = fs.readFileSync(filePath);
      fs.unlinkSync(filePath);

      // Return the QR code image
      return qrCodeImage;
    } catch (error) {
      throw new Error('Error generating QR code');
    }
  }
}

module.exports = new QRCodeGenerator();
