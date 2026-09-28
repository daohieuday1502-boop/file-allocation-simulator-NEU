// chỗ này để tạo ra 20 ô trống trên "giao diện"
import {
  createDisk,
  releaseFile,
  TOTAL_BLOCKS,
  BLOCK_SIZE_BYTES
} from "./core/disk.js";

import {
  createFile
} from "./core/file.js";

import {
  allocateContiguous
} from "./allocations/contiguous.js";

import {
  allocateLinked
} from "./allocations/linked.js";

import {
  allocateIndexed
} from "./allocations/indexed.js";


const TEST_FILES = [
  {
    id: "F01",
    name: "notes.txt",
    sizeBytes: 6100
  },

  {
    id: "F02",
    name: "report.docx",
    sizeBytes: 18500
  },

  {
    id: "F03",
    name: "photo.jpg",
    sizeBytes: 52000
  },

  {
    id: "F04",
    name: "data.csv",
    sizeBytes: 33000
  },

  {
    id: "F05",
    name: "slides.pptx",
    sizeBytes: 88000
  },

  {
    id: "F06",
    name: "archive.zip",
    sizeBytes: 120000
  }
];


let disk = createDisk(TOTAL_BLOCKS);

let allocatedFiles = [];


const fileSelect =
  document.getElementById("file-select");

const fileInfo =
  document.getElementById("file-info");

const allocateButton =
  document.getElementById("allocate-button");

const resetButton =
  document.getElementById("reset-button");

const diskContainer =
  document.getElementById("disk-container");

const diskStats =
  document.getElementById("disk-stats");

const message =
  document.getElementById("message");

const allocationDetails =
  document.getElementById("allocation-details");

const fileList =
  document.getElementById("file-list");


function populateFileSelect() {

  TEST_FILES.forEach((file) => {

    const option =
      document.createElement("option");

    option.value = file.id;

    option.textContent =
      `${file.name} (${file.sizeBytes} bytes)`;

    fileSelect.appendChild(option);
  });

}


function getSelectedFileDefinition() {

  return TEST_FILES.find(
    (file) => file.id === fileSelect.value
  );

}


function showSelectedFileInfo() {

  const definition =
    getSelectedFileDefinition();

  const file =
    createFile(
      definition,
      BLOCK_SIZE_BYTES
    );

  fileInfo.textContent =
    `File name: ${file.name}
File size: ${file.sizeBytes} bytes
Block size: ${file.blockSizeBytes} bytes
Required data blocks: ${file.requiredDataBlocks}`;
}


function getSelectedMethod() {

  const selected =
    document.querySelector(
      'input[name="allocation-method"]:checked'
    );

  return selected.value;
}


function allocateSelectedFile() {

  const definition =
    getSelectedFileDefinition();

  const alreadyExists =
    allocatedFiles.some(
      (file) => file.id === definition.id
    );

  if (alreadyExists) {
    message.textContent =
      "This test file is already allocated.";

    return;
  }


  const file =
    createFile(
      definition,
      BLOCK_SIZE_BYTES
    );


  const method =
    getSelectedMethod();


  let result;


  if (method === "CONTIGUOUS") {

    result =
      allocateContiguous(file, disk);

  } else if (method === "LINKED") {

    result =
      allocateLinked(file, disk);

  } else {

    result =
      allocateIndexed(file, disk);

  }


  message.textContent =
    result.message;


  if (!result.success) {
    return;
  }


  allocatedFiles.push(file);


  renderDisk();

  renderDiskStats();

  renderFileList();

  renderAllocationDetails(file);
}


function renderDisk() {

  diskContainer.innerHTML = "";


  disk.forEach((block) => {

    const blockElement =
      document.createElement("div");

    blockElement.className =
      "disk-block";


    if (block.status === "USED") {
      blockElement.classList.add("used");
    }


    if (block.kind === "INDEX") {
      blockElement.classList.add("index");
    }


    const idLabel =
      document.createElement("span");

    idLabel.className =
      "block-id";

    idLabel.textContent =
      block.id;


    const ownerLabel =
      document.createElement("span");

    ownerLabel.className =
      "block-owner";

    ownerLabel.textContent =
      block.fileId ?? "FREE";


    blockElement.appendChild(idLabel);

    blockElement.appendChild(ownerLabel);


    let tooltip =
      `Block ${block.id}
Status: ${block.status}`;


    if (block.fileId !== null) {

      tooltip +=
        `\nFile: ${block.fileId}`;

      tooltip +=
        `\nType: ${block.kind}`;
    }


    if (block.nextBlock !== null) {

      tooltip +=
        `\nNext block: ${block.nextBlock}`;
    }


    if (block.kind === "INDEX") {

      tooltip +=
        `\nPointers: ${block.indexEntries.join(", ")}`;
    }


    blockElement.title =
      tooltip;


    diskContainer.appendChild(
      blockElement
    );

  });

}


function renderDiskStats() {

  const used =
    disk.filter(
      (block) =>
        block.status === "USED"
    ).length;

  const free =
    TOTAL_BLOCKS - used;


  diskStats.textContent =
    `Block size: ${BLOCK_SIZE_BYTES} bytes
Total blocks: ${TOTAL_BLOCKS}
Disk capacity: ${TOTAL_BLOCKS * BLOCK_SIZE_BYTES} bytes
Used blocks: ${used}
Free blocks: ${free}`;
}


function renderAllocationDetails(file) {

  let details =
    `File: ${file.name}
File size: ${file.sizeBytes} bytes
Required data blocks: ${file.requiredDataBlocks}
Method: ${file.allocationMethod}`;


  if (
    file.allocationMethod ===
    "CONTIGUOUS"
  ) {

    details +=
      `\nStart block: ${file.startBlock}`;

    details +=
      `\nData blocks: ${file.dataBlocks.join(", ")}`;

  }


  if (
    file.allocationMethod ===
    "LINKED"
  ) {

    details +=
      `\nStart block: ${file.startBlock}`;

    details +=
      `\nEnd block: ${file.endBlock}`;

    details +=
      `\nBlock chain: ${file.dataBlocks.join(" → ")}`;

  }


  if (
    file.allocationMethod ===
    "INDEXED"
  ) {

    details +=
      `\nIndex block: ${file.indexBlock}`;

    details +=
      `\nData blocks: ${file.dataBlocks.join(", ")}`;

    details +=
      `\nPhysical blocks used: ${file.requiredDataBlocks + 1}`;

  }


  allocationDetails.textContent =
    details;
}


function renderFileList() {

  fileList.innerHTML = "";


  if (allocatedFiles.length === 0) {

    fileList.textContent =
      "No files allocated yet.";

    return;
  }


  allocatedFiles.forEach((file) => {

    const row =
      document.createElement("div");

    row.className =
      "file-row";


    const text =
      document.createElement("span");

    text.textContent =
      `${file.name} — ${file.allocationMethod}`;


    const deleteButton =
      document.createElement("button");

    deleteButton.className =
      "delete-button";

    deleteButton.textContent =
      "Delete";


    deleteButton.addEventListener(
      "click",
      () => deleteFile(file.id)
    );


    row.appendChild(text);

    row.appendChild(deleteButton);

    fileList.appendChild(row);

  });

}


function deleteFile(fileId) {

  releaseFile(
    disk,
    fileId
  );


  allocatedFiles =
    allocatedFiles.filter(
      (file) =>
        file.id !== fileId
    );


  message.textContent =
    `File ${fileId} deleted. Blocks released.`;


  allocationDetails.textContent =
    "No file selected.";


  renderDisk();

  renderDiskStats();

  renderFileList();
}


function resetSimulator() {

  disk =
    createDisk(TOTAL_BLOCKS);


  allocatedFiles = [];


  message.textContent =
    "Simulator reset.";


  allocationDetails.textContent =
    "No file allocated yet.";


  renderDisk();

  renderDiskStats();

  renderFileList();
}


fileSelect.addEventListener(
  "change",
  showSelectedFileInfo
);


allocateButton.addEventListener(
  "click",
  allocateSelectedFile
);


resetButton.addEventListener(
  "click",
  resetSimulator
);


populateFileSelect();

showSelectedFileInfo();

renderDisk();

renderDiskStats();

renderFileList();
