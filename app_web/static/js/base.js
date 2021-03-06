const URL = {
  'status': {
    'GET': '/api/status/get/',
    'POST': '/api/status/post/',
    'DELETE': '/api/status/delete/',
  },
  'profile': {
    'PUT': '/api/profile/put/',
    'SAVE': '/api/profile/save/',
  },
  'friend': {
    'GET': '/api/friend/get-friend-candidate/',
    'POST': '/api/friend/post-new-friend/',
  },
};

const propState = {
  'status': {
    'progress': false,
    'next': URL.status.GET + '?page=2',
    'previous': URL.status.GET + '?page=1',
  },
};


// Setup an event listener to make an API call once auth is complete
function onLinkedInLoad() {
  IN.Event.on(IN, "auth", getProfileData);
}

// Handle the successful return from the API call
function onSuccess(data) {
  console.log(data);
  const csrfToken = $('[name=csrfmiddlewaretoken]').val();
  $.ajax({
    method:'PUT',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    url: '/api/profile/put/',
    data: {
      'first_name': data.firstName,
      'last_name': data.lastName,
      'email': data.emailAddress,
      'picture_url': data.pictureUrl,
      'id_linkedin': data.id,
      'link_linkedin': data.publicProfileUrl,
    }
  })
}

// Handle an error response from the API call
function onError(error) {
  console.log(error);
}

// Use the API call wrapper to request the member's basic profile data
function getProfileData() {
  IN.API.Raw("/people/~:(firstName,lastName,siteStandardProfileRequest,emailAddress,id,picture-url,public-profile-url)").result(onSuccess).error(onError);
}

const canLoadPage = () => {
  return $('.status').length > 10 && !propState.status.progress
      && propState.status.next !== '';
};

const addStatusToTimeline = (status, to) => {

  let user_photo = '/static/img/user_dummy.png';

  if(status.user.picture_url !== ''){
    user_photo = status.user.picture_url;
  }

  html = '<div id="status-' + status.id + '" class="status">\n' +
      '     <div class="user-dp">\n' +
      '       <img src="' + user_photo + '">\n' +
      '     </div>\n' +
      '     <div class="status-content">\n' +
      '       <span>\n' +
      '         <h3>' + status.user.full_name + '</h3>\n' +
      '         <p>' + status.user.username + '</p>\n' +
      '       </span>\n' +
      '         <p>' + status.content + '</p>\n' +
      '      </div>\n' +
      '      <div class="right-status">' +
      '        <span class="status-date">\n' + status.created_at + '</span>\n' +
      '       <button class="fa fa-trash-o trash" aria-hidden="true"' +
      '         onclick="deleteStatus(\'status-' + status.id + '\')"></button>' +
      '      </div>\n' +
      ' </div>';

  const newStatus = $(html);
  newStatus.hide();
  if (to === 'top' || to === 'TOP') {
    $('#timeline').prepend(newStatus);
    newStatus.show('normal');
  } else if (to === 'bottom' || to === 'BOTTOM') {
    $('#timeline').append(newStatus);
    newStatus.fadeIn('slow');
  }
};

const WINDOW = $(window);
WINDOW.scroll(() => {

  if (WINDOW.scrollTop() + WINDOW.height() > $(document).height() - 10 && canLoadPage()) {
    propState.status.progress = true;
    $.ajax({
      method: 'GET',
      url: propState.status.next,
      success: (response) => {
        const result = response.result;
        for (let i = 0; i < result.length; i++) {
          addStatusToTimeline(result[i], 'BOTTOM')
        }

        propState.status.next = response.next_page;
        propState.status.previous = response.previous_page;
        propState.status.progress = false;
      },
      error: () => {

      }
    })
  }

});


const deleteStatus = (id) => {

  const statusId = id.split('-')[1];
  const csrfToken = $('[name=csrfmiddlewaretoken]').val();
  $.ajax({
    method: 'DELETE',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    url: URL.status.DELETE,
    data: {
      'id': statusId,
    },
    success: (response) => {
      $('#' + id).remove();
    },
    error: (response) => {

    },
  });


};

const openTab = (event, idTab) => {
  console.log("open tab " + idTab);
  let i;
  // change button
  const tabButton = $('.tab-button');
  const active = 'tab-button-active';
  for (i = 0; i < tabButton.length; i++) {
    $(tabButton[i]).removeClass(active)
  }
  $(event.currentTarget).addClass(active);
  // scroll to that tab button, could be more well-design
  $('#activity-tab').animate({scrollLeft: event.clientX - 100}, 750);

  // change tab content
  const tabContent = $('.tab-content');
  for (i = 0; i < tabContent.length; i++) {
    $(tabContent[i]).hide();
  }

  $('\#' + idTab).fadeToggle('slow');
};

const scrollToId = (id) => {
  const targetElem = $('#' + id);
  // CANT USE WINDOW
  $('html,body').animate({scrollTop: targetElem.offset().top - 80}, 1000);
}

const calculateChar = () => {

};

const addFriend = (npm) => {

  const csrfToken = $('[name=csrfmiddlewaretoken]').val();

  $.ajax({
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    url: URL.friend.POST,
    data: {
      'npm':npm,
    },
    success: (response) => {

    },
    error: (response) => {

    },
  })
};

const saveProfile = () => {

  const csrfToken = $('[name=csrfmiddlewaretoken]').val();
  const radio = $('input[name=radio]:checked', '#form-score').val();

  let value = false;
  if (radio === 'Ya') {
    value = true;
  }

  $.ajax({
    method: 'PUT',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    data: {
      'is_showing_score': value,
    },
    url: URL.profile.SAVE,
    success: (response) => {
      const mess = $('#message-success');
      mess.show().delay(3000).fadeOut();
      mess.css('display','flex');
      location.reload();
    },
    error: (response) => {

    },
  })
};

$(document).ready(() => {

  // SCROLL TO PROFILE TAB BUTTON
  $('#activity-tab').animate({scrollLeft: 50}, 750);

  // BIND CLICK: Button kirim status
  $('#submit-post').on('click', (event) => {
    const statusElem = $('#status-textarea');
    const content = statusElem.val();

    const csrfToken = $('[name=csrfmiddlewaretoken]').val();

    $.ajax({
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      url: URL.status.POST,
      data: {
        'content': content,
      },
      success: (response) => {
        //add to top of timeline
        const status = response.result;
        addStatusToTimeline(status, 'TOP');
        // change latest status
        $('#latest-status-content').text(status.content);
        // increament the numbers of status
        const num = $('#stat-status-number');
        num.text(
            parseInt(num.text()) + 1
        );
        // empty the textarea
        statusElem.val('');
      },
      error: () => {

      },
    });

    event.preventDefault();
  });

  $('#stats-friends').on('click', (event) => {
    const id = 'tab-friend';
    openTab(event, id);
    scrollToId(id);
  });

  $('#stats-status').on('click', (event) => {
    const id = 'tab-status';
    openTab(event, id);
    scrollToId(id);
  });

  $('#tab-button-edit-profile,#menu-edit-profile').on('click', (event) => {
    const id = 'tab-edit-profile';
    openTab(event, id);
    scrollToId(id);
  });

  $('#save-button').on('click', (event) => {
    saveProfile()
  });

  $('#friend-table').DataTable({
    'bPaginate': false,
    'bLengthChange': false,
    'bInfo': false,
    'ajax': {
      'dataType': 'json',
      'contentType': 'application/json; charshet=utf-8',
      'url': URL.friend.GET,
      'dataSrc': 'result',
    },
    'columns': [
      {
        'data': 'npm'
      },
      {
        'data': 'full_name',
        'fnCreatedCell': (nTd, sData, oData, iRow, iCol) => {
          $(nTd).text(oData.full_name);
        }
      },
      {
        'data': 'angkatan',
        'fnCreatedCell': (nTd, sData, oData, iRow, iCol) => {
          $(nTd).text(oData.angkatan);
        }
      },
      {
        'data': null,
        'defaultContent': '',
        'fnCreatedCell': (nTd, sData, oData, iRow, iCol) => {
          const exp = oData.expertise;
          if (exp.length > 0) {
            for (let i = 0; i < exp.length; i++) {
              let expert = exp[i];
              $(nTd).append('<p>' + expert.expertise + ' (' + expert.level + ')</p>')
            }
          }
        }
      },
      // {
      //   'data': null,
      //   'defautContent': '',
      //   'fnCreatedCell': (nTd, sData, oData, iRow, iCol) => {
      //     const npm = oData.npm;
      //     const param = `'${npm}', ${nTd}`;
      //     $(nTd).append('<button onclick="addFriend(' + param + ')"> Tambah Teman</button>');
      //   }
      // }
    ]
  });

});
