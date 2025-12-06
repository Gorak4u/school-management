
// Base64 encoding function that works in both browser and Node environments
const toBase64 = (str: string): string => {
  try {
    // Browser environment
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    // Node.js environment fallback
    // Access Buffer via globalThis to avoid TypeScript error when @types/node is missing
    const globalObj = (typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {})) as any;
    
    if (globalObj.Buffer) {
      return globalObj.Buffer.from(str, 'utf8').toString('base64');
    }
    throw new Error("Unable to encode string to Base64: environment not supported.");
  }
};

/**
 * Pushes data to a specified GitHub repository as a new file.
 */
export const pushDataToGithub = async (pat: string, repo: string, data: any, fileName: string): Promise<{ success: boolean, message: string }> => {
  if (!repo || !repo.includes('/')) {
    return { success: false, message: 'Invalid repository format. Use "owner/repo-name".' };
  }
  
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${fileName}`;

  const headers = {
    'Authorization': `Bearer ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  try {
    // Prepare the content for upload
    const content = toBase64(JSON.stringify(data, null, 2));
    const commitMessage = `Automated data backup: ${new Date().toISOString()}`;
    
    const body = {
      message: commitMessage,
      content: content,
    };
    
    // Create the file
    const putResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (putResponse.ok) {
      return { success: true, message: `Successfully pushed ${fileName} to ${repo}!` };
    } else {
      const errorData = await putResponse.json();
      // If file already exists, it's not a critical error for this workflow, but good to know.
      if (putResponse.status === 422) {
          return { success: false, message: `File already exists or validation failed: ${errorData.message}` };
      }
      return { success: false, message: `GitHub API Error (PUT): ${errorData.message || putResponse.statusText}` };
    }

  } catch (error) {
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))) {
      return { success: false, message: 'Network error: Failed to connect to GitHub.' };
    }
    return { success: false, message: `An unexpected error occurred: ${(error as Error).message}` };
  }
};
