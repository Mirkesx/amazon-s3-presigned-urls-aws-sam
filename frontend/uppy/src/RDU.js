import "react-dropzone-uploader/dist/styles.css";
import Dropzone from "react-dropzone-uploader";
import axios from 'axios';

const MyUploader = () => {
  // specify upload params and url for your files
  const getUploadParams = async ({ file, meta: { name } }) => {
    // const { uploadUrl, fileUrl } = await myApiService.getPresignedUploadParams(name)
    const presignedURL = await axios.get("https://afxuh9ku02.execute-api.us-east-2.amazonaws.com/uploads");
    console.log("CIAO", presignedURL);
    return {
      body: file,
      method: "put",
      url:
        "https://dev-assembly-flows.s3.us-west-1.amazonaws.com/5ae639b425ca241b3e2d4b07/60a7ddb674a64ece9dd65d1b/60aea2b903c28511abbbf19a/60a7ddb674a64ec24dd65d1e/officer_fuzzy_face.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA3MIQMQV3CLMOS7MF%2F20210531%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20210531T202239Z&X-Amz-Expires=518400&X-Amz-Signature=21fad97376f342118aded3af88deb92ae3f0974aa401a78853b135f281a28ac2&X-Amz-SignedHeaders=host"
    };
  };

  // called every time a file's `status` changes
  const handleChangeStatus = ({ meta, file }, status) => {
    console.log(status, meta, file);
  };

  // receives array of files that are done uploading when submit button is clicked
  const handleSubmit = (files, allFiles) => {
    console.log(files.map((f) => f.meta));
    allFiles.forEach((f) => f.remove());
  };

  return (
    <Dropzone
      getUploadParams={getUploadParams}
      onChangeStatus={handleChangeStatus}
      onSubmit={handleSubmit}
      accept="image/*,audio/*,video/*"
    />
  );
};

export default MyUploader;
