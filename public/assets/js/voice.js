$(document).ready(() => {
  $(document).on("click", ".activate", function () {
    $("#logMsg").text("");
    $("#hangup").hide();
    $("#call").show();
    $.get("/token", (data) => {
      Twilio.Device.setup(data);
      Twilio.Device.ready(function (device) {
        console.log("Twilio.Device Ready!");
        $(".call_modal").modal("show");

        // $("#call_controls").css("display", "block");
      });

      Twilio.Device.error(function (error) {
        console.log("Twilio.Device Error: " + error.message);
        Twilio.Device.destroy();
        $(".call_modal").modal("hide");
      });
      Twilio.Device.connect(function (conn) {
        console.log("Successfully established call!");
        $("#logMsg").text("Calling ......");
        $("#call").hide();
        $("#hangup").show();
      });

      Twilio.Device.disconnect(function (conn) {
        $(".modal").modal("hide");
        // $(".modal").hide();
        console.log("Call Ended");
        Twilio.Device.disconnectAll();
        Twilio.Device.destroy();
      });
    });
  });

  $("#call").on("click", () => {
    // var params = {
    //   To: $("#phoneNumber").val().trim(),
    // };
    // console.log("Calling " + params.To + "...");
    // Twilio.Device.connect(params);
    if (Twilio.Device.status() === "ready") {
      Twilio.Device.connect({ To: 5045154776 });
    } else {
      $("#logMsg").text(
        "Device is Inactive. Please close this window and reopen it"
      );
    }
  });

  $("#hangup").on("click", () => {
    console.log("hangup!!!");
    Twilio.Device.disconnectAll();
    Twilio.Device.destroy();
    // $(".modal").hide();
    $(".modal").modal("hide");
    // $(".modal").hide();
  });

  $(".close").on("click", () => {
    Twilio.Device.destroy();
    // $(".modal").hide();
    $(".modal").modal("hide");
  });
});
