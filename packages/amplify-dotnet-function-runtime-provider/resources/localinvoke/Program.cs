using System;
using Newtonsoft.Json.Linq;
using System.Threading.Tasks;

namespace InvocationShim
{
    partial class Program
    {
        public static async Task<int> Main(string[] args) {
            if (args.Length < 1) {
                Console.WriteLine("You must supply the handler name.");
                return 1;
            }
            var handlerSegments = args[0].Split("::");
            if (handlerSegments.Length != 3) {
                Console.WriteLine("You must supply the handler name in <assemblyName>::<namespace-qualified type name>::<method> format.");
                return 2;
            }

            var pathToAssembly = System.IO.Path.Join(Environment.CurrentDirectory, "dist", handlerSegments[0] + ".dll");
            System.Reflection.Assembly lambdaAssembly = null;           
            try {
                var resolver = new AssemblyResolver(pathToAssembly);
                lambdaAssembly = resolver.Assembly;
                if (lambdaAssembly == null) {
                    Console.WriteLine($"Unable to load assembly '{handlerSegments[0]}' from {pathToAssembly}");
                    return 3;
                }
            } catch (System.IO.FileNotFoundException) {
                Console.WriteLine($"Unable to load assembly '{handlerSegments[0]}' from {pathToAssembly}. File not found.");
                return 3;
            }

            /*
            The below two lines need to match the namespace.class and handler method name
            defined in your Lambda function. If you change them in your function, you
            will need to update the two lines below.
            */
            var handlerType = lambdaAssembly.GetType(handlerSegments[1]);
            if (handlerType == null) {
                Console.WriteLine($"Unable to load type '{handlerSegments[1]}' from assembly.");
                return 4;
            }
            var handlerMethod = handlerType.GetMethod(handlerSegments[2]);
            if (handlerMethod == null) {
                Console.WriteLine($"Unable to load handler method '{handlerSegments[2]}' from '{handlerSegments[1]}'.");
                return 5;
            }

            // Prepare to deserialize the event data
            var inputType = handlerMethod.GetParameters()[0].ParameterType;
            var serializerType = typeof(Amazon.Lambda.Serialization.Json.JsonSerializer);
            var serializer = new Amazon.Lambda.Serialization.Json.JsonSerializer();

            object eventData;
            using (var eventStream = Console.OpenStandardInput())
            {
                var deserializeMethod = serializerType.GetMethod("Deserialize").MakeGenericMethod(inputType);
                eventData = deserializeMethod.Invoke(serializer, new[] { eventStream });
            }

            var lambdaInstance = Activator.CreateInstance(handlerType);
            var task = (Task)handlerMethod.Invoke(lambdaInstance, new[] { eventData, new MockContext(handlerType.Name) });
            
            await task.ConfigureAwait(false);
            var resultProperty = task.GetType().GetProperty("Result");
            object result = resultProperty.GetValue(task);
            var serializeMethod = serializerType.GetMethod("Serialize").MakeGenericMethod(resultProperty.PropertyType);
            using (var outStream = Console.OpenStandardOutput())
            {
                serializeMethod.Invoke(serializer, new[] { result, outStream });
            }
            return 0;
        }
    }
}
