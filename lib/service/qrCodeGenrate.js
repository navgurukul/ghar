const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

class QRCodeGenerator {
  async generateQRCode(data, size, eccLevel) {
    if (!data) {
      throw new Error('Missing "data" field in the request payload');
    }

    try {
    
      const qrCodeFilePath = path.join(__dirname, '../halpers', `${data}_qrcode.png`);
      await QRCode.toFile(qrCodeFilePath, data, {
        errorCorrectionLevel: eccLevel,
        width: size,
      });

      // Read the image data
      const imageData = await fs.readFile(qrCodeFilePath);
     
      await fs.unlink(qrCodeFilePath);
      // Return the Data URL for immediate use (e.g., embedding in HTML)
      return imageData;
  
    } catch (error) {
      throw new Error('Error generating QR code');
    }
  }
}

module.exports = new QRCodeGenerator();
