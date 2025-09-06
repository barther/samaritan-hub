import { toast } from "@/hooks/use-toast";

interface ErrorDetails {
  title: string;
  userMessage: string;
  technicalDetails: string;
}

/**
 * Creates user-friendly error messages with technical details
 */
export function createErrorMessage(
  error: any, 
  context: string = "operation"
): ErrorDetails {
  // Extract technical details
  const technicalDetails = error?.message || 
    error?.error?.message || 
    error?.details || 
    JSON.stringify(error);

  // Create user-friendly message based on context and error type
  let userMessage = "Something went wrong. Please try again.";
  let title = "Error";

  // Database/Supabase specific errors
  if (error?.code || error?.error_code) {
    switch (error.code || error.error_code) {
      case 'PGRST116':
        userMessage = "No data found or you don't have permission to access this information.";
        break;
      case '23505':
        userMessage = "This record already exists. Please check for duplicates.";
        break;
      case '23503':
        userMessage = "Cannot delete this record because it's connected to other data.";
        break;
      case 'auth/invalid-session':
        userMessage = "Your session has expired. Please log in again.";
        break;
      default:
        userMessage = "A database error occurred. Please contact support if this continues.";
    }
  }

  // Network errors
  if (error?.name === 'NetworkError' || technicalDetails.includes('fetch')) {
    userMessage = "Connection problem. Please check your internet and try again.";
  }

  // Validation errors
  if (technicalDetails.includes('validation') || technicalDetails.includes('required')) {
    userMessage = "Please check that all required fields are filled out correctly.";
  }

  // Customize title and message based on context
  switch (context.toLowerCase()) {
    case 'save':
    case 'create':
      title = "Save Failed";
      userMessage = userMessage.includes("Something went wrong") 
        ? "Unable to save your changes. Please try again." 
        : userMessage;
      break;
    case 'load':
    case 'fetch':
      title = "Loading Failed";
      userMessage = userMessage.includes("Something went wrong") 
        ? "Unable to load the requested data. Please refresh the page." 
        : userMessage;
      break;
    case 'delete':
      title = "Delete Failed";
      userMessage = userMessage.includes("Something went wrong") 
        ? "Unable to delete this item. Please try again." 
        : userMessage;
      break;
    case 'upload':
      title = "Upload Failed";
      userMessage = userMessage.includes("Something went wrong") 
        ? "File upload failed. Please check the file and try again." 
        : userMessage;
      break;
  }

  return {
    title,
    userMessage,
    technicalDetails
  };
}

/**
 * Shows an error toast with both user-friendly and technical information
 */
export function showErrorToast(error: any, context: string = "operation") {
  const { title, userMessage, technicalDetails } = createErrorMessage(error, context);
  
  toast({
    title,
    description: `${userMessage}\n\nTechnical details: ${technicalDetails}`,
    variant: "destructive",
  });
}

/**
 * Logs error details for debugging while showing user-friendly toast
 */
export function handleError(error: any, context: string = "operation", logPrefix?: string) {
  const { title, userMessage, technicalDetails } = createErrorMessage(error, context);
  
  // Log full error details for debugging
  console.error(`${logPrefix || 'Error'} [${context}]:`, {
    error,
    technicalDetails,
    userMessage,
    timestamp: new Date().toISOString()
  });

  // Show user-friendly toast
  toast({
    title,
    description: `${userMessage}\n\nTechnical details: ${technicalDetails}`,
    variant: "destructive",
  });
}