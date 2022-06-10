import AwsS3 from "@uppy/aws-s3";
import { Dashboard, DragDrop } from "@uppy/react";
import Tus from "@uppy/tus";
import Uppy from "@uppy/core";
import RDU from "./RDU";

import "./styles.css";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import axios from 'axios';



const uppy = new Uppy({
  autoProceed: true
});
// uppy.use(Tus, {
//   endpoint: "https://tusd.tusdemo.net/files/", // use your tus endpoint here
//   resume: true,
//   retryDelays: [0, 1000, 3000, 5000],
//   autoProceed: true
// });
uppy.use(AwsS3, {
  getUploadParameters: async (file) => {
    console.log("Before upload:", file);
    const res = await axios.get("https://afxuh9ku02.execute-api.us-east-2.amazonaws.com/uploads", { params: { extension: file.extension, type: file.type } });
    console.log("presignedURL", res.data.uploadURL);
    return {
      method: "PUT",
      url: res.data.uploadURL,
      // fields: data.fields,
      // Provide content type header required by S3
      headers: {
        "Content-Type": file.type
      }
    };
  }
});

uppy.on("file-added", (file) => {
  console.log("Added file", file);
});

uppy.on("upload", (data) => {
  // data object consists of `id` with upload ID and `fileIDs` array
  // with file IDs in current upload
  const { id, fileIDs } = data;
  console.log(`Starting upload ${id} for files ${fileIDs}`);
});

uppy.on("progress", (progress) => {
  // progress: integer (total progress percentage)
  console.log(progress);
});

uppy.on("upload-success", (file, response) => {
  console.log("upload success");
  console.log(file.name, response.uploadURL);
});

uppy.on("complete", (result) => {
  console.log("successful files:", result.successful);
  console.log("failed files:", result.failed);
});

uppy.on("error", (error) => {
  console.error(error.stack);
});

uppy.on("upload-error", (file, error, response) => {
  console.log("error with file:", file.id);
  console.log("error message:", error);
});

export default function App() {
  return (
    <>
      {/* <DragDrop
        width="100%"
        height="100%"
        note="Images up to 200×200px"
        uppy={uppy}
        locale={{
          strings: {
            // Text to show on the droppable area.
            // `%{browse}` is replaced with a link that opens the system file selection dialog.
            dropHereOr: "Drop here or %{browse}",
            // Used as the label for the link that opens the system file selection dialog.
            browse: "browse"
          }
        }}
      /> */}
      <Dashboard uppy={uppy} />
    </>
    //<RDU />
  );
}
