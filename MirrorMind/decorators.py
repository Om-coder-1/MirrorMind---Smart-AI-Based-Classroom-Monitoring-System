from django.shortcuts import redirect

def student_required(view_func):
    def wrapper(request, *args, **kwargs):
        if 'student_id' not in request.session:
            return redirect('/student-login/')
        return view_func(request, *args, **kwargs)
    return wrapper


def teacher_required(view_func):
    def wrapper(request, *args, **kwargs):
        if 'teacher_id' not in request.session:
            return redirect('/teacher-login/')
        return view_func(request, *args, **kwargs)
    return wrapper
