import DataUriParser from "datauri/parser.js"
import path from "path";

const getDataUri = (file) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('Invalid file or missing buffer');
        }

        const parser = new DataUriParser();
        const extName = path.extname(file.originalname || '').toString();
        
        // Log file info for debugging
        console.log(`Processing file: ${file.originalname}, extension: ${extName}, size: ${file.buffer.length} bytes`);
        
        // Format the file based on extension and buffer
        return parser.format(extName, file.buffer);
    } catch (error) {
        console.error('Error in getDataUri:', error);
        throw new Error(`Failed to convert file to data URI: ${error.message}`);
    }
}

export default getDataUri;