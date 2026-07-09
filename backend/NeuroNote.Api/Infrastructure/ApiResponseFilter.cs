using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using NeuroNote.Api.Dtos;

namespace NeuroNote.Api.Infrastructure;

public class ApiResponseFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        if (context.Exception is not null || context.Result is EmptyResult or NoContentResult or FileResult)
        {
            return;
        }

        if (context.Result is ObjectResult objectResult)
        {
            if (IsApiResponse(objectResult.Value))
            {
                return;
            }

            var statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;
            objectResult.Value = statusCode >= 200 && statusCode < 300
                ? ApiResponse<object>.Ok(objectResult.Value)
                : ApiResponse<object>.Fail(ExtractMessage(objectResult.Value, statusCode));
            return;
        }

        if (context.Result is StatusCodeResult statusCodeResult && statusCodeResult.StatusCode >= 400)
        {
            context.Result = new ObjectResult(ApiResponse<object>.Fail(ExtractMessage(null, statusCodeResult.StatusCode)))
            {
                StatusCode = statusCodeResult.StatusCode
            };
        }
    }

    private static bool IsApiResponse(object? value)
    {
        if (value is null)
        {
            return false;
        }

        var type = value.GetType();
        return type.IsGenericType && type.GetGenericTypeDefinition() == typeof(ApiResponse<>);
    }

    private static string ExtractMessage(object? value, int statusCode)
    {
        if (value is ProblemDetails problemDetails && !string.IsNullOrWhiteSpace(problemDetails.Detail))
        {
            return problemDetails.Detail;
        }

        if (value is ProblemDetails { Title: not null } titledProblem)
        {
            return titledProblem.Title;
        }

        var messageProperty = value?.GetType().GetProperty("message") ?? value?.GetType().GetProperty("Message");
        var message = messageProperty?.GetValue(value)?.ToString();

        if (!string.IsNullOrWhiteSpace(message))
        {
            return message;
        }

        return statusCode switch
        {
            StatusCodes.Status400BadRequest => "The request is invalid.",
            StatusCodes.Status401Unauthorized => "Authentication is required.",
            StatusCodes.Status403Forbidden => "You do not have permission to perform this action.",
            StatusCodes.Status404NotFound => "The requested resource was not found.",
            StatusCodes.Status409Conflict => "The request conflicts with the current resource state.",
            _ => "The request could not be completed."
        };
    }
}
