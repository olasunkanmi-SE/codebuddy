/**
 * Script to copy WASM files from node_modules to dist directory
 * Required for Transformer.js v4 offline support in VS Code extension
 */

const fs = require('fs-extra');
const path = require('path');

// Paths
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const transformersPath = path.join(nodeModulesPath, '@huggingface', 'transformers');
const ortWebPath = path.join(nodeModulesPath, 'onnxruntime-web');
const distWasmPath = path.join(__dirname, '..', 'dist', 'wasm');
const distWorkersPath = path.join(__dirname, '..', 'dist', 'workers');
const distPath = path.join(__dirname, '..', 'dist');

/**
 * Copy WASM files from transformers and onnxruntime-web packages
 */
async function copyWasmFiles() {
    try {
        console.log('🔄 Starting WASM files copy...');

        // Check if transformers is installed
        if (!fs.existsSync(transformersPath)) {
            console.warn('⚠️  @huggingface/transformers not found in node_modules');
        }

        // Ensure destination directories exist
        await fs.ensureDir(distWasmPath);
        await fs.ensureDir(distWorkersPath);
        console.log(`✓ Created directories: ${distWasmPath}, ${distWorkersPath}`);

        // Find WASM files in transformers and onnxruntime-web
        let wasmFiles = [];
        if (fs.existsSync(transformersPath)) {
            const transformersWasm = await findWasmFiles(transformersPath);
            wasmFiles = wasmFiles.concat(transformersWasm);
        }
        if (fs.existsSync(ortWebPath)) {
            const ortWebWasm = await findWasmFiles(ortWebPath);
            wasmFiles = wasmFiles.concat(ortWebWasm);
        }

        if (wasmFiles.length === 0) {
            console.warn('⚠️  No WASM files found in @huggingface/transformers or onnxruntime-web');
            return;
        }

        console.log(`📦 Found ${wasmFiles.length} WASM file(s)`);

        // Copy each WASM file to multiple locations to ensure they are found by all components
        const destDirs = [distWasmPath, distWorkersPath, distPath];
        let totalCopied = 0;

        for (const wasmFile of wasmFiles) {
            const fileName = path.basename(wasmFile);
            
            for (const destDir of destDirs) {
                const destPath = path.join(destDir, fileName);
                await fs.copy(wasmFile, destPath);
                totalCopied++;
            }
            console.log(`  ✓ Copied: ${fileName} to multiple locations`);
        }

        console.log(`✅ Successfully copied ${wasmFiles.length} file(s) to ${destDirs.length} locations each.`);
        
        // Also copy any .data files that might be needed
        await copyDataFiles();
        
    } catch (error) {
        console.error('❌ Failed to copy WASM files:', error);
        process.exit(1);
    }
}

/**
 * Recursively find all .wasm files
 */
async function findWasmFiles(dir) {
    let wasmFiles = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip node_modules subdirectories
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                const subWasmFiles = await findWasmFiles(fullPath);
                wasmFiles = wasmFiles.concat(subWasmFiles);
            } else if (entry.isFile() && (entry.name.endsWith('.wasm') || entry.name.endsWith('.mjs'))) {
                wasmFiles.push(fullPath);
            }
        }
    } catch (error) {
        // Ignore permission errors for subdirectories
        if (error.code !== 'EACCES' && error.code !== 'EPERM') {
            throw error;
        }
    }

    return wasmFiles;
}

/**
 * Copy .data files that might be needed by ONNX Runtime
 */
async function copyDataFiles() {
    try {
        const dataFiles = await findDataFiles(transformersPath);
        
        if (dataFiles.length > 0) {
            console.log(`📦 Found ${dataFiles.length} .data file(s)`);
            
            for (const dataFile of dataFiles) {
                const fileName = path.basename(dataFile);
                const destPath = path.join(distWasmPath, fileName);
                
                await fs.copy(dataFile, destPath);
                console.log(`  ✓ Copied: ${fileName}`);
            }
        }
    } catch (error) {
        console.warn('⚠️  Failed to copy .data files:', error);
    }
}

/**
 * Find .data files
 */
async function findDataFiles(dir) {
    let dataFiles = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && entry.name !== 'node_modules') {
                const subDataFiles = await findDataFiles(fullPath);
                dataFiles = dataFiles.concat(subDataFiles);
            } else if (entry.isFile() && entry.name.endsWith('.data')) {
                dataFiles.push(fullPath);
            }
        }
    } catch (error) {
        if (error.code !== 'EACCES' && error.code !== 'EPERM') {
            throw error;
        }
    }

    return dataFiles;
}

// Run the copy function
copyWasmFiles();
