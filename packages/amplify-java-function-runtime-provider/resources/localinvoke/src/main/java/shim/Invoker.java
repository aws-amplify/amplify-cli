package shim;

import com.google.gson.Gson;
import java.io.File;
import java.util.Scanner;
import java.net.URLClassLoader;
import java.net.URL;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.lang.IllegalStateException;

/**
 * Amplify Java Lambda Function shim
 * 
 * Loads lambda jar file, reads event from stdin and writes result on stdout
 */
public class Invoker {
    private static final Gson GSON = new Gson();

    private final Method handlerMethod;
    private final Object handlerInstance; 

    public static void main(String[] args) throws Exception {
        final Invoker invoker = new Invoker(args[0], args[1], args[2]);
        invoker.start();
    }

    private Invoker(final String lambdaJarPath, final String handlerClassName, final String handlerMethodName) throws Exception {
        // load lambda handler
        final URLClassLoader child = new URLClassLoader(
                new URL[] {(new File(lambdaJarPath)).toURI().toURL()},
                this.getClass().getClassLoader()
        );
        final Class classToLoad = Class.forName(handlerClassName, true, child);
        handlerMethod = Arrays.stream(classToLoad.getMethods())
                .filter(method -> method.getName().equals(handlerMethodName))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Could not find handler method named " + handlerMethodName + " in class " + handlerClassName));
        Constructor<Class<?>> constructor = classToLoad.getConstructor();
        handlerInstance = constructor.newInstance();
    }

    // read event from stdin, invoke handler and return result on stdout
    private void start() throws Exception {
        // read event from stdin
        final Scanner scanner = new Scanner(System.in);
        final String eventString = scanner.nextLine();
        scanner.close();
        final Object event = GSON.fromJson(eventString, handlerMethod.getParameterTypes()[0]);
        
        // invoke the handler
        final Object response = handlerMethod.invoke(handlerInstance, event, new MockContext());
        System.out.println(); // print blank line to ensure lambda logs don't interfere
        System.out.println(GSON.toJson(response));
    }
}