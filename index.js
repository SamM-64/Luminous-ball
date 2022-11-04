"use strict";

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const buffers = window.primitives.createSphereBuffers(gl, 10, 48, 24);

  // setup GLSL program
  const program = webglUtils.createProgramFromScripts(gl, [
    "vertex-shader-3d",
    "fragment-shader-3d",
  ]);
  const uniformSetters = webglUtils.createUniformSetters(gl, program);
  const attribSetters = webglUtils.createAttributeSetters(gl, program);

  const attribs = {
    a_position: { buffer: buffers.position, numComponents: 3 },
    a_normal: { buffer: buffers.normal, numComponents: 2 },
    a_texcoord: { buffer: buffers.texcoord, numComponents: 2 },
  };

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  const cameraAngleRadians = degToRad(0);
  const fieldOfViewRadians = degToRad(60);
  const cameraHeight = 50;

  const uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos: [-50, 40, 100],
    u_viewInverse: m4.identity(),
    u_lightColor: [1, 1, 2, 1],
  };

  const uniformsThatAreComputedForEachObject = {
    u_worldViewProjection: m4.identity(),
    u_world: m4.identity(),
    u_worldInverseTranspose: m4.identity(),
  };

  const rand = function (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  };

  const randInt = function (range) {
    return Math.floor(Math.random() * range);
  };

  const textures = [
    textureUtils.makeStripeTexture(gl, { color1: "#FFF", color2: "#CCC" }),
    textureUtils.makeCheckerTexture(gl, { color1: "#1E1E1E", color2: "#CCC" }),
    textureUtils.makeCircleTexture(gl, { color1: "#FFF", color2: "#CCC" }),
  ];

  const objects = [];
  const numObjects = 200;
  const baseColor = rand(240);
  for (var ii = 0; ii < numObjects; ++ii) {
    objects.push({
      radius: rand(150),
      xRotation: rand(Math.PI * 2),
      yRotation: rand(Math.PI),
      materialUniforms: {
        u_colorMult: chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
        u_diffuse: textures[randInt(textures.length)],
        u_specular: [1, 1, 1, 1],
        u_shininess: rand(500),
        u_specularFactor: rand(1),
      },
    });
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time = time * 0.0001 + 5;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(
      fieldOfViewRadians,
      aspect,
      1,
      2000
    );

    // Compute the camera's matrix using look at.
    const cameraPosition = [0, 0, 100];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(
      cameraPosition,
      target,
      up,
      uniformsThatAreTheSameForAllObjects.u_viewInverse
    );

    // Make a view matrix from the camera matrix.
    const viewMatrix = m4.inverse(cameraMatrix);

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    gl.useProgram(program);

    // Setup all the needed attributes.
    webglUtils.setAttributes(attribSetters, attribs);

    // Bind the indices.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Set the uniforms that are the same for all objects.
    webglUtils.setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);

    // Draw objects
    objects.forEach(function (object) {
      // Compute a position for this object based on the time.
      let worldMatrix = m4.xRotation(object.xRotation * time);
      worldMatrix = m4.yRotate(worldMatrix, object.yRotation * time);
      worldMatrix = m4.translate(worldMatrix, 0, 0, object.radius);
      uniformsThatAreComputedForEachObject.u_world = worldMatrix;

      // Multiply the matrices.
      m4.multiply(
        viewProjectionMatrix,
        worldMatrix,
        uniformsThatAreComputedForEachObject.u_worldViewProjection
      );
      m4.transpose(
        m4.inverse(worldMatrix),
        uniformsThatAreComputedForEachObject.u_worldInverseTranspose
      );

      // Set the uniforms we just computed
      webglUtils.setUniforms(
        uniformSetters,
        uniformsThatAreComputedForEachObject
      );

      // Set the uniforms that are specific to the this object.
      webglUtils.setUniforms(uniformSetters, object.materialUniforms);

      // Draw the geometry.
      gl.drawElements(gl.TRIANGLES, buffers.numElements, gl.UNSIGNED_SHORT, 0);
    });

    requestAnimationFrame(drawScene);
  }
}

main();
