import tensorflow as tf

# Suppose your model is something like:
# y = model(x)
# and you want to maximize y with respect to x

# # Load your trained model
# model = tf.keras.models.load_model("model.keras")

# # Optionally inspect the input shape
# print("Model input shape:", model.input_shape)

def optimize_input(model, x):
    # Initialize x as a TensorFlow variable (requires gradient)
    input_dim = model.input_shape[1]  # e.g., 10

    # Initialize with random or chosen values
    x = tf.Variable(tf.random.normal(shape=(1, input_dim)), trainable=True)


    # x = tf.Variable(initial_value=tf.random.normal(shape=(1, input_dim)))

    optimizer = tf.keras.optimizers.Adam(learning_rate=0.01)

    for step in range(100):
        with tf.GradientTape() as tape:
            y = model(x)
            # We want to maximize y, so minimize the negative
            loss = -y
        grads = tape.gradient(loss, [x])
        optimizer.apply_gradients(zip(grads, [x]))

    # x now should approximately maximize the model output
    # print("Optimized input:", x.numpy())
    # print("Predicted output:", model(x).numpy())
    return x.numpy(), model(x).numpy()
