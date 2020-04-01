using System;
using Amazon.Lambda.Core;

namespace InvocationShim
{
    internal class MockLogger : ILambdaLogger
    {
        public void Log(string message) => Console.Write(message);
        public void LogLine(string message) => Console.WriteLine(message);
    }
}
