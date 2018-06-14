<?php

function loadModules($libURL, ...$modules) {
  $css = "";
  $code = "window.dependencies = ".json_encode($modules).";\n";
  foreach ($modules as $module) {
    $content = file_get_contents("$libURL/$module.js");
    $code .= $content;
    if (substr($content, 0, 6) === "//#CSS") $css .= file_get_contents("$libURL/../css/$module.css");
  }
  $code .= "document.querySelector('style').innerText += `$css`;";
  return $code;
}
