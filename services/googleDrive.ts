
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const initGoogleDrive = (clientId: string, apiKey: string, updateSigninStatus: (isSignedIn: boolean) => void) => {
  const gapi = (window as any).gapi;
  const google = (window as any).google;

  return new Promise<void>((resolve, reject) => {
    if (!gapi || !google) {
        reject("Google Scripts not loaded");
        return;
    }

    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: DISCOVERY_DOCS,
        });

        // Initialize Token Client
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (tokenResponse: any) => {
             if (tokenResponse && tokenResponse.access_token) {
                 updateSigninStatus(true);
             }
          },
        });

        resolve(tokenClient);
      } catch (err) {
        reject(err);
      }
    });
  });
};

const getFolderId = async () => {
  const gapi = (window as any).gapi;
  const q = "mimeType='application/vnd.google-apps.folder' and name='SVS_School_Backups' and trashed=false";
  const response = await gapi.client.drive.files.list({
    q: q,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  } else {
    // Create folder
    const fileMetadata = {
      name: 'SVS_School_Backups',
      mimeType: 'application/vnd.google-apps.folder',
    };
    const createResponse = await gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });
    return createResponse.result.id;
  }
};

export const uploadToDrive = async (data: any, fileName: string) => {
    const gapi = (window as any).gapi;
    try {
        const folderId = await getFolderId();
        
        const fileContent = JSON.stringify(data, null, 2);
        const file = new Blob([fileContent], { type: 'application/json' });
        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: [folderId],
        };

        const accessToken = gapi.client.getToken().access_token;
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form,
        });

        console.log("Drive Backup Successful: ", fileName);
        return true;

    } catch (error) {
        console.error("Error uploading to Drive", error);
        throw error;
    }
};

export const cleanupOldBackups = async (daysToKeep: number = 100) => {
  const gapi = (window as any).gapi;
  try {
    const folderId = await getFolderId();
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const timeString = cutoffDate.toISOString();

    // Query files inside our folder that are older than cutoff
    // Note: q parameter uses 'createdTime'
    const q = `'${folderId}' in parents and mimeType='application/json' and createdTime < '${timeString}' and trashed=false`;
    
    let pageToken = null;
    do {
      const response: any = await gapi.client.drive.files.list({
        q: q,
        fields: 'nextPageToken, files(id, name, createdTime)',
        spaces: 'drive',
        pageToken: pageToken
      });
      
      const files = response.result.files;
      if (files && files.length > 0) {
        console.log(`Found ${files.length} old backup files to delete.`);
        const batch = gapi.client.newBatch();
        files.forEach((file: any) => {
            batch.add(gapi.client.drive.files.delete({ fileId: file.id }));
        });
        await batch.then(() => console.log("Batch delete completed"));
      }
      
      pageToken = response.result.nextPageToken;
    } while (pageToken);

  } catch (error) {
    console.error("Error cleaning up old backups", error);
  }
};
