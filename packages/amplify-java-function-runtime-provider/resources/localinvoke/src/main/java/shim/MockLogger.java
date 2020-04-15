package shim;
import com.amazonaws.services.lambda.runtime.*;
import java.util.Arrays;

public class MockLogger implements LambdaLogger {
    @Override
    public void log(String var1) {
        System.out.println(var1);
    }

    @Override
    public void log(byte[] byteArray) {
        System.out.println(Arrays.toString(byteArray));
    }
}