$(document).ready(function () {
  // $("#sidebarCollapse").on("click", function () {
  //   $("#sidebar").toggleClass("active");
  //   var width = $("#sidebar").css("width");

  //   console.log(width);
  // });

  // $.get("/allSpecialists", (result) => {
  //   var firstName = result[0].firstName;
  //   var lastName = result[0].lastName;
  //   // console.log($(this.result));
  //   $(".userFirstName").text("");
  //   $(".userFirstName").append(`
  //   ${firstName}
  //       `);
  //   $(".userLastName").text("");
  //   $(".userLastName").append(`
  //   ${lastName}
  //       `);
  //   $("#initals").text("");
  //   $("#initals").append(`
  //      ${firstName[0]}${lastName[0]}
  //           `);
  // });

  $("#sidebar").hover(function () {
    var vpWidth = parseInt($(window).width());
    if (vpWidth > 700) {
      $("#sidebar").toggleClass("active");
      var width = $("#sidebar").css("width");
      console.log(width);
      if (width === "90px") {
        setTimeout(() => {
          $("#brandName").show();
          $("#profileImage").show();
          $("#jobTitle").show();
          $(".sidebar-header h3").fadeIn(100);
        });
      } else {
        $("#brandName").hide();
        $("#profileImage").hide();
        $("#jobTitle").hide();
        $(".sidebar-header h3").hide();
      }
    } //End of if(vpWidth )
  });

  $(function () {
    $("#myTab li:first-child a").tab("show");
  });

  // settings tabs buttons and forms

  $("#updatePersonal").click(function () {
    $("#disabledPersonal").prop("disabled", false);
    $("#cancelBtn").show();
    $("#saveBtn").show();
  });

  $("#updateProfile").click(function () {
    $("#disabledProfile").prop("disabled", false);
    $("#cancelProfile").show();
    $("#saveProfile").show();
    $("#uploadImg").show();
  });

  $("#cancelBtn", "#saveBtn").click(function () {
    $("#disabledPersonal").prop("disabled", true);
    $("#cancelBtn").hide();
    $("#saveBtn").hide();
  });

  $("#cancelProfile", "#saveProfile").click(function () {
    $("#disabledProfile").prop("disabled", true);
    $("#cancelProfile").hide();
    $("#saveProfile").hide();
    $("#uploadImg").hide();
  });

  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
  // end settings tabs buttons and forms

  // TICKET JS

  $(function () {
    $("#showall").click(function () {
      $(".targetDiv").show();
    });

    $(".showSingle").click(function () {
      $(".targetDiv").hide();
      $("#div" + $(this).attr("target")).show();
    });

    // === THE OPPOSITE OF WHAT I WANT
    $("#openTic").click(function () {
      $(".openTickets").hide();
    });
  });
});
