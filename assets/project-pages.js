(function () {
  var pageId = document.body.getAttribute("data-page") || location.pathname;
  var storagePrefix = "portfolio-page:" + pageId + ":";
  var status = document.querySelector("[data-save-status]");

  function setStatus(message) {
    if (!status) return;
    status.textContent = message;
  }

  function editableKey(element) {
    return storagePrefix + "field:" + element.getAttribute("data-field");
  }

  function imageKey(input) {
    return storagePrefix + "image:" + input.getAttribute("data-image-input");
  }

  function setPlainText(element, value) {
    element.textContent = value;
  }

  document.querySelectorAll("[data-field]").forEach(function (element) {
    element.setAttribute("contenteditable", "true");
    element.setAttribute("spellcheck", "true");
    var saved = localStorage.getItem(editableKey(element));
    if (saved !== null) {
      setPlainText(element, saved);
    }

    element.addEventListener("input", function () {
      localStorage.setItem(editableKey(element), element.textContent);
      setStatus("Saved locally");
    });

    element.addEventListener("paste", function (event) {
      event.preventDefault();
      var text = "";
      if (event.clipboardData) {
        text = event.clipboardData.getData("text/plain");
      }
      document.execCommand("insertText", false, text);
    });
  });

  document.querySelectorAll("[data-image-input]").forEach(function (input) {
    var targetId = input.getAttribute("data-image-target");
    var target = document.querySelector('[data-image-box="' + targetId + '"]');
    var preview = target ? target.querySelector("[data-image-preview]") : null;
    var remove = document.querySelector('[data-remove-image="' + targetId + '"]');
    var savedImage = localStorage.getItem(imageKey(input));

    function showImage(src) {
      if (!target || !preview) return;
      preview.src = src;
      target.classList.add("has-image");
    }

    function clearImage() {
      if (!target || !preview) return;
      preview.removeAttribute("src");
      target.classList.remove("has-image");
      localStorage.removeItem(imageKey(input));
      input.value = "";
      setStatus("Image removed");
    }

    if (savedImage) {
      showImage(savedImage);
    }

    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.match(/^image\//)) {
        setStatus("Choose an image file");
        input.value = "";
        return;
      }

      var reader = new FileReader();
      reader.addEventListener("load", function () {
        var dataUrl = String(reader.result || "");
        showImage(dataUrl);
        try {
          localStorage.setItem(imageKey(input), dataUrl);
          setStatus("Image loaded and saved locally");
        } catch (error) {
          setStatus("Image loaded for this session; file is too large for local save");
        }
      });
      reader.readAsDataURL(file);
    });

    if (remove) {
      remove.addEventListener("click", clearImage);
    }
  });

  document.querySelectorAll('[data-action="reset-edits"]').forEach(function (button) {
    button.addEventListener("click", function () {
      var keys = [];
      for (var index = 0; index < localStorage.length; index += 1) {
        var key = localStorage.key(index);
        if (key && key.indexOf(storagePrefix) === 0) {
          keys.push(key);
        }
      }
      keys.forEach(function (key) {
        localStorage.removeItem(key);
      });
      location.reload();
    });
  });

  setStatus("Ready to edit");
})();
