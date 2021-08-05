const webgl={
  compileShader:function(gl, type, source){
    if(type!="VERTEX_SHADER"&&type!="FRAGMENT_SHADER") return null;
    const shaderType=(type=="VERTEX_SHADER")? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    const shader=gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      alert("Compile Error!! " + gl.getShaderInfoLog(shader));
      gl.deleteShader( shader );
      return null;
    }
    return shader;
  },
  createProgram:function(gl, vertexShaderSource, fragmentShaderSource){
    let vertexShaderObject=this.compileShader(gl, "VERTEX_SHADER", vertexShaderSource);
    let fragmentShaderObject=this.compileShader(gl, "FRAGMENT_SHADER", fragmentShaderSource);
    if(vertexShaderObject==null||fragmentShaderObject==null) return null;

    let program = gl.createProgram();
    gl.attachShader(program, vertexShaderObject);
    gl.attachShader(program, fragmentShaderObject);

    gl.linkProgram( program );
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
      alert("Link Error!! Could not initialise shaders!!");
      gl.deleteProgram( program );
      return null;
    }
    gl.useProgram(program);
    function deleteGLObjects(){
      try{
        gl.detachShader(program, vertexShaderObject);
        gl.detachShader(program, fragmentShaderObject);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShaderObject);
        gl.deleteShader(fragmentShaderObject);
      }catch(e){}
    }
    gl.canvas.addEventListener('unload', function(){ deleteGLObjects() }, false);
    return program;
  }
}
