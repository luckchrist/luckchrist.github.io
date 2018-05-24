// Navigation toggle
$('.toggle').click(function() {
  if ($('#overlay.open')) {
    $(this).toggleClass('active');
    $('#overlay').toggleClass('open');
  }
});

// YouTube Player
$(function() {
  $(".player").mb_YTPlayer();

  $('#video-play').click(function(e) {
    e.preventDefault();
    if ($(this).hasClass('fa-play')) {
      $('.player').playYTP();
    } else {
      $('.player').pauseYTP();
    }
    $(this).toggleClass('fa-play fa-pause');
    return false;
  });

  $('#video-volume').click(function(e) {
    e.preventDefault();
    $('.player').toggleVolume();
    $(this).toggleClass('fa-volume-off fa-volume-up');
    return false;
  });
});